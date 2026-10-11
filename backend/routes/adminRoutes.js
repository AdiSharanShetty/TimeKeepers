// Admin order API (contract Section 5). Mounted at /api/admin.
// Requires auth + admin role; non-admins get 403, missing/invalid user 401.

const express = require('express');
const db = require('../db');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { mapOrderItem } = require('../lib/serializers');

const ALLOWED_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

function formatAdminOrder(order, items) {
  const mapped = (items || []).map(mapOrderItem);
  return {
    id: order.order_id,
    order_id: order.order_id,
    customer: {
      id: order.user_id,
      name: order.customer_name != null ? order.customer_name : null,
      email: order.customer_email != null ? order.customer_email : null,
    },
    status: order.status,
    totalAmount: Number(order.net_total) || 0,
    net_total: order.net_total,
    createdAt: order.date,
    date: order.date,
    itemCount: mapped.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    thumbnails: mapped.map((i) => i.image).filter(Boolean),
    shipping: {
      name: order.shipping_name != null ? order.shipping_name : null,
      email: order.shipping_email != null ? order.shipping_email : null,
      phone: order.shipping_phone != null ? order.shipping_phone : null,
      address: order.shipping_address != null ? order.shipping_address : null,
    },
    paymentMethod: order.payment_method != null ? order.payment_method : null,
    notes: order.notes != null ? order.notes : null,
    items: mapped,
  };
}

async function getItemsByOrder(orderIds) {
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

router.use(requireAdmin);

// GET /api/admin/orders?status=&page=&limit=  (newest first)
router.get('/orders', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status).toLowerCase() : null;
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = status ? 'WHERE LOWER(o.status) = ?' : '';
    const params = status ? [status] : [];

    const countRows = await q(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);
    const total = countRows[0].total;

    const orders = await q(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.date DESC, o.order_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const itemsByOrder = await getItemsByOrder(orders.map((o) => o.order_id));
    res.json({
      orders: orders.map((o) => formatAdminOrder(o, itemsByOrder[o.order_id])),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'A valid order id is required' });
  }
  try {
    const rows = await q(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const itemsByOrder = await getItemsByOrder([orderId]);
    res.json(formatAdminOrder(rows[0], itemsByOrder[orderId]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load order' });
  }
});

// PATCH /api/admin/orders/:id/status { status }
router.patch('/orders/:id/status', async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'A valid order id is required' });
  }
  const status = req.body && req.body.status ? String(req.body.status).toLowerCase() : null;
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }
  try {
    const result = await q('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    const rows = await q(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );
    const itemsByOrder = await getItemsByOrder([orderId]);
    res.json(formatAdminOrder(rows[0], itemsByOrder[orderId]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
