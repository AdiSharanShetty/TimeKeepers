const express=require('express');
const db=require('../db');
const router=express.Router();
const { requireUser } = require('../middleware/auth');
const { hasColumn } = require('../lib/schema');
const { mapOrderItem } = require('../lib/serializers');

const dbp = db.promise();

const q = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

function formatOrder(order, items) {
    return {
        id: order.order_id,
        order_id: order.order_id,
        userId: order.user_id,
        status: order.status,
        totalAmount: Number(order.net_total) || 0,
        net_total: order.net_total,
        createdAt: order.date,
        date: order.date,
        shipping: {
            name: order.shipping_name != null ? order.shipping_name : null,
            email: order.shipping_email != null ? order.shipping_email : null,
            phone: order.shipping_phone != null ? order.shipping_phone : null,
            address: order.shipping_address != null ? order.shipping_address : null,
        },
        paymentMethod: order.payment_method != null ? order.payment_method : null,
        notes: order.notes != null ? order.notes : null,
        items: (items || []).map(mapOrderItem),
    };
}

async function getOrderItems(orderIds) {
    if (!orderIds.length) return {};
    const placeholders = orderIds.map(() => '?').join(',');
    const rows = await q(
        `SELECT * FROM order_transactions WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
        orderIds
    );
    return rows.reduce((acc, row) => {
        (acc[row.order_id] = acc[row.order_id] || []).push(row);
        return acc;
    }, {});
}

// Insert an `orders` row, adapting to optional shipping columns when they
// exist (added by scripts/migrateOrderColumns.js). Shared by the cart checkout
// and the direct Buy Now flow so both persist the same fields.
async function insertOrder(userId, user, body, { total, status = 'pending' }) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const orderCols = ['user_id', 'date', 'net_total', 'status'];
    const orderVals = [userId, now, total, status];
    const shipping = {
        name: body.name || body.fullName || (user && user.name) || null,
        email: body.email || (user && user.email) || null,
        phone: body.phone || null,
        address: body.address || null,
        payment_method: body.paymentMethod || body.payment_method || null,
        notes: body.notes || null,
    };
    if (await hasColumn('orders', 'shipping_name')) { orderCols.push('shipping_name'); orderVals.push(shipping.name); }
    if (await hasColumn('orders', 'shipping_email')) { orderCols.push('shipping_email'); orderVals.push(shipping.email); }
    if (await hasColumn('orders', 'shipping_phone')) { orderCols.push('shipping_phone'); orderVals.push(shipping.phone); }
    if (await hasColumn('orders', 'shipping_address')) { orderCols.push('shipping_address'); orderVals.push(shipping.address); }
    if (await hasColumn('orders', 'payment_method')) { orderCols.push('payment_method'); orderVals.push(shipping.payment_method); }
    if (await hasColumn('orders', 'notes')) { orderCols.push('notes'); orderVals.push(shipping.notes); }

    const result = await q(
        `INSERT INTO orders (${orderCols.join(', ')}) VALUES (${orderCols.map(() => '?').join(', ')})`,
        orderVals
    );
    return result.insertId;
}

// Snapshot line items into order_transactions, adapting to optional columns.
// `price` is the UNIT price; quantity is stored separately when the column exists.
async function insertOrderItems(orderId, userId, items) {
    const hasName = await hasColumn('order_transactions', 'product_name');
    const hasImage = await hasColumn('order_transactions', 'image');
    const hasQty = await hasColumn('order_transactions', 'quantity');
    for (const item of items) {
        const cols = ['order_id', 'user_id', 'product_id', 'description', 'price'];
        const vals = [
            orderId,
            userId,
            item.product_id,
            item.description || item.product_name || `Order for product ${item.product_id}`,
            Number(item.price) || 0,
        ];
        if (hasName) { cols.push('product_name'); vals.push(item.product_name); }
        if (hasImage) { cols.push('image'); vals.push(item.image); }
        if (hasQty) { cols.push('quantity'); vals.push(Number(item.quantity) || 1); }
        await q(`INSERT INTO order_transactions (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, vals);
    }
}

async function createOrderFromCart(userId, user, body) {
    await dbp.beginTransaction();
    try {
        const items = await q(
            `SELECT ci.product_id, ci.quantity, p.pname, p.image, p.price
             FROM cart_items ci JOIN product p ON p.id = ci.product_id
             WHERE ci.user_id = ? FOR UPDATE`,
            [userId]
        );
        if (items.length === 0) {
            const err = new Error('EMPTY_CART');
            err.code = 'EMPTY_CART';
            throw err;
        }

        const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

        const orderId = await insertOrder(userId, user, body, { total, status: 'pending' });
        await insertOrderItems(orderId, userId, items.map((item) => ({
            product_id: item.product_id,
            product_name: item.pname,
            image: item.image,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            description: item.pname,
        })));

        await q('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        await dbp.commit();

        const order = await q('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        return formatOrder(order[0], items.map((i) => ({
            product_id: i.product_id,
            product_name: i.pname,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            description: i.pname,
        })));
    } catch (err) {
        await dbp.rollback();
        throw err;
    }
}


async function createLegacySingleOrder(userId, user, body) {
    const { productId, quantity = 1 } = body;
    if (!productId) {
        const err = new Error('MISSING_PRODUCT');
        err.code = 'MISSING_PRODUCT';
        throw err;
    }
    const products = await q('SELECT id, pname, image, price FROM product WHERE id = ?', [productId]);
    if (products.length === 0) {
        const err = new Error('PRODUCT_NOT_FOUND');
        err.code = 'PRODUCT_NOT_FOUND';
        throw err;
    }
    const product = products[0];
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Number(product.price) || 0;
    const total = unitPrice * qty;

    await dbp.beginTransaction();
    try {
        const orderId = await insertOrder(userId, user, body, { total, status: 'pending' });
        await insertOrderItems(orderId, userId, [{
            product_id: product.id,
            product_name: product.pname,
            image: product.image,
            price: unitPrice,
            quantity: qty,
            description: product.pname,
        }]);
        await dbp.commit();

        const order = await q('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        const itemRows = await q('SELECT * FROM order_transactions WHERE order_id = ? ORDER BY id ASC', [orderId]);
        return formatOrder(order[0], itemRows);
    } catch (e) {
        await dbp.rollback();
        throw e;
    }
}

// ===== Contract endpoint: POST /api/orders =====
// Primary flow builds the order from the SERVER-SIDE cart (prices from DB),
// snapshots the items, and clears the cart atomically.
// Backwards-compatible: if the cart is empty but the body carries a single
// `productId`, a legacy single-product order is created so the existing
// Buy Now page keeps working until the frontend switches to the cart flow.
router.post('/orders', requireUser, async (req, res) => {
    const body = req.body || {};
    try {
        const order = await createOrderFromCart(req.userId, req.user, body);
        return res.status(201).json(order);
    } catch (err) {
        if (err && err.code === 'EMPTY_CART' && body.productId != null) {
            try {
                return res.status(201).json(await createLegacySingleOrder(req.userId, req.user, body));
            } catch (legacyErr) {
                if (legacyErr && legacyErr.code === 'PRODUCT_NOT_FOUND') {
                    return res.status(404).json({ error: 'Product not found' });
                }
                return res.status(500).json({ error: 'Failed to create order' });
            }
        }
        if (err && err.code === 'EMPTY_CART') {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        return res.status(500).json({ error: 'Failed to create order' });
    }
});

// Legacy single-product order (explicit endpoint).
router.post('/orders/legacy-single', requireUser, async (req, res) => {
    try {
        return res.status(201).json(await createLegacySingleOrder(req.userId, req.user, req.body || {}));
    } catch (err) {
        if (err && err.code === 'MISSING_PRODUCT') return res.status(400).json({ error: 'productId is required' });
        if (err && err.code === 'PRODUCT_NOT_FOUND') return res.status(404).json({ error: 'Product not found' });
        return res.status(500).json({ error: 'Failed to create order' });
    }
});

// ===== Contract endpoints: GET /api/orders/mine and GET /api/orders/:id =====
// '/orders/:id' falls through (next()) for non-numeric ids so the existing
// '/orders/fetch' route (declared below) is not captured as an :id.

router.get('/orders/mine', requireUser, async (req, res) => {
    try {
        const orders = await q(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC, order_id DESC',
            [req.userId]
        );
        const itemsByOrder = await getOrderItems(orders.map((o) => o.order_id));
        res.json(orders.map((o) => formatOrder(o, itemsByOrder[o.order_id])));
    } catch (err) {
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

router.get('/orders/:id', requireUser, async (req, res, next) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
        // Not a real id (e.g. '/orders/fetch') -> fall through to later routes.
        return next();
    }
    try {
        const rows = await q('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const order = rows[0];
        const isAdmin = String((req.user.role || '')).toLowerCase() === 'admin';
        if (order.user_id !== req.userId && !isAdmin) {
            return res.status(403).json({ error: 'You cannot view this order' });
        }
        const itemsByOrder = await getOrderItems([order.order_id]);
        res.json(formatOrder(order, itemsByOrder[order.order_id]));
    } catch (err) {
        res.status(500).json({ error: 'Failed to load order' });
    }
});

router.get('/orders/fetch',(req,res)=>{
    // const sql='SELECT u.name,o.order_id,o.net_total,p.pname,o.status FROM users u INNER JOIN orders o ON o.user_id = u.id INNER JOIN product p ON o.user_id = p.userid';
    // const sql="SELECT o.order_id, u.name AS customer_name, p.pname AS ordered_product, o.net_total, o.status FROM orders o INNER JOIN order_transactions ot ON o.order_id = ot.order_id INNER JOIN users u ON ot.user_id = u.id INNER JOIN product p ON ot.product_id = p.id";
    // const sql="SELECT o.order_id, u.name, p.pname FROM orders o INNER JOIN order_transactions ot ON o.order_id = ot.order_id INNER JOIN users u ON ot.user_id = u.id INNER JOIN product p ON ot.product_id = p.id;"
    const sql = `
    SELECT
    o.order_id,
    o.date,
    o.user_id,
    u.name AS username,
    o.net_total,
    o.status,
    ot.product_id,
    pr.pname AS product_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN payment p ON o.order_id = p.payment_number  
    JOIN order_transactions ot ON o.order_id = ot.order_id
    JOIN product pr ON ot.product_id = pr.id
    ORDER BY o.date DESC
    `;
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
            res.json(results);
    });
});

router.delete('/orders/delete-order/:order_id',(req,res)=>{
    const { order_id } = req.params;
    const sql= 'delete from orders where order_id=?';
    db.query(sql,[order_id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('Order deleted successfully');
    });
});

router.put('/orders/:id',(req,res)=>{
    const{id}=req.params;
    const{status}=req.body;
    const sql='update orders set status=? where order_id=?';
    db.query(sql,[status,id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send("Order updated successfully");
    });
});

module.exports=router;