// Cart API (contract Section 5). Mounted at /api/cart. Auth required.
// Backed by the existing `cart_items` table (one row per user+product).
// Quantities are validated server-side; prices always come from `product`.

const express = require('express');
const db = require('../db');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const { mapProduct } = require('../lib/serializers');

const MAX_QTY = 99;

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

function parseQuantity(value, { allowZero = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  const min = allowZero ? 0 : 1;
  if (n < min || n > MAX_QTY) return null;
  return n;
}

// Upsert one cart row without relying on a specific unique key (the live
// cart_items table has no product_name column and its keys may vary), so this
// works regardless of how the table was created.
async function upsertCartItem(userId, productId, quantity, price) {
  const existing = await q(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1',
    [userId, productId]
  );
  if (existing.length > 0) {
    const nextQty = Math.min(MAX_QTY, (Number(existing[0].quantity) || 0) + quantity);
    await q('UPDATE cart_items SET quantity = ? WHERE id = ?', [nextQty, existing[0].id]);
  } else {
    await q(
      'INSERT INTO cart_items (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [userId, productId, quantity, Number(price) || 0]
    );
  }
}

async function getCart(userId) {
  const rows = await q(
    `SELECT ci.product_id, ci.quantity,
            p.id, p.pname, p.description, p.image, p.price, p.pricetype,
            p.status, p.userid, p.categoryid, p.featured
     FROM cart_items ci
     LEFT JOIN product p ON p.id = ci.product_id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC, ci.id DESC`,
    [userId]
  );

  let subtotal = 0;
  let count = 0;
  const items = rows.map((row) => {
    const quantity = Number(row.quantity) || 0;
    const product = row.id != null ? mapProduct(row) : null;
    const price = product ? Number(product.price) || 0 : 0;
    subtotal += price * quantity;
    count += quantity;
    return { product, quantity, lineTotal: price * quantity };
  });

  return { items, subtotal, count };
}

router.use(requireUser);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

// POST /api/cart/items { productId, quantity }
router.post('/items', async (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = parseQuantity(req.body.quantity == null ? 1 : req.body.quantity);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'A valid productId is required' });
  }
  if (quantity == null) {
    return res.status(400).json({ error: `quantity must be an integer between 1 and ${MAX_QTY}` });
  }
  try {
    const products = await q('SELECT id, pname, price FROM product WHERE id = ?', [productId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = products[0];

    await upsertCartItem(req.userId, productId, quantity, product.price);
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to add cart item' });
  }
});

// PATCH /api/cart/items/:productId { quantity }  (quantity <= 0 removes the row)
router.patch('/items/:productId', async (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = parseQuantity(req.body.quantity, { allowZero: true });
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'A valid productId is required' });
  }
  if (quantity == null) {
    return res.status(400).json({ error: `quantity must be an integer between 0 and ${MAX_QTY}` });
  }
  try {
    if (quantity === 0) {
      await q('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, productId]);
    } else {
      const result = await q(
        'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.userId, productId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item not in cart' });
      }
    }
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'A valid productId is required' });
  }
  try {
    await q('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, productId]);
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// DELETE /api/cart -> empty cart
router.delete('/', async (req, res) => {
  try {
    await q('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// POST /api/cart/merge { items: [{ productId, quantity }] } -> guest cart merged in
router.post('/merge', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: 'No cart items provided' });
  }
  try {
    for (const item of items) {
      const productId = Number(item.productId != null ? item.productId : item.id);
      const quantity = parseQuantity(item.quantity == null ? 1 : item.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || quantity == null) continue; // skip invalid rows

      const products = await q('SELECT id, pname, price FROM product WHERE id = ?', [productId]);
      if (products.length === 0) continue; // product no longer exists
      const product = products[0];

      await upsertCartItem(req.userId, productId, quantity, product.price);
    }
    res.json(await getCart(req.userId));
  } catch (err) {
    console.error('[cart] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
});

module.exports = router;
