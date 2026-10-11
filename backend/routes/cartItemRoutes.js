// const express = require('express');
// const db = require('../db');
// const router = express.Router();

// router.get('/cart-items', (req, res) => {
//   const userId = req.query.userId;
//   const sql = userId
//     ? 'SELECT id, user_id, product_id, quantity, price, created_at FROM cart_items WHERE user_id = ? ORDER BY created_at DESC'
//     : 'SELECT id, user_id, product_id, quantity, price, created_at FROM cart_items ORDER BY created_at DESC';

//   db.query(sql, userId ? [userId] : [], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to fetch cart items', details: err });
//     }
//     res.json(results);
//   });
// });

// router.post('/cart-items/sync', (req, res) => {
//   const { userId, items } = req.body;

//   if (!userId) {
//     return res.status(400).json({ error: 'User ID is required' });
//   }

//   const normalizedItems = Array.isArray(items) ? items : [];

//   if (normalizedItems.length === 0) {
//     return res.status(400).json({ error: 'No cart items provided' });
//   }

//   const processItem = (index) => {
//     const item = normalizedItems[index];
//     if (!item) {
//       return res.json({ success: true, message: 'Cart synced successfully' });
//     }

//     const productId = Number(item.productId || item.id || item.product_id || 0);
//     const quantity = Number(item.quantity) || 1;
//     const price = Number(item.price) || 0;

//     if (!productId) {
//       return res.status(400).json({ error: 'Product ID is required for each cart item' });
//     }

//     db.query('SELECT id, quantity, price FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId], (selectErr, existingRows) => {
//       if (selectErr) {
//         return res.status(500).json({ error: 'Failed to check cart row', details: selectErr });
//       }

//       const nextQuantity = existingRows.length > 0 ? (Number(existingRows[0].quantity) || 0) + quantity : quantity;
//       const nextPrice = existingRows.length > 0 ? (Number(existingRows[0].price) || 0) + price * quantity : price * quantity;

//       const sql = existingRows.length > 0
//         ? 'UPDATE cart_items SET quantity = ?, price = ? WHERE user_id = ? AND product_id = ?'
//         : 'INSERT INTO cart_items (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';

//       const values = existingRows.length > 0
//         ? [nextQuantity, nextPrice, userId, productId]
//         : [userId, productId, nextQuantity, nextPrice];

//       db.query(sql, values, (err) => {
//         if (err) {
//           return res.status(500).json({ error: 'Failed to save cart item', details: err });
//         }

//         processItem(index + 1);
//       });
//     });
//   };

//   processItem(0);
// });

// router.delete('/cart-items/:userId', (req, res) => {
//   const { userId } = req.params;

//   db.query('DELETE FROM cart_items WHERE user_id = ?', [userId], (err, result) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to clear cart items', details: err });
//     }

//     res.json({ success: true, deletedRows: result.affectedRows });
//   });
// });

// module.exports = router;



////newnewnew
// const express = require('express');
// const db = require('../db');
// const router = express.Router();

// // GET all cart items (or filtered by userId) — used by admin page
// router.get('/cart-items', (req, res) => {
//   const userId = req.query.userId;
//   const sql = userId
//     ? 'SELECT id, user_id, product_ids, quantity, price, created_at FROM cart_items WHERE user_id = ? ORDER BY created_at DESC'
//     : 'SELECT id, user_id, product_ids, quantity, price, created_at FROM cart_items ORDER BY created_at DESC';

//   db.query(sql, userId ? [userId] : [], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to fetch cart items', details: err });
//     }
//     res.json(results);
//   });
// });

// // Sync (create or update) a user's cart — one row per user
// router.post('/cart-items/sync', (req, res) => {
//   const { userId, items } = req.body;

//   if (!userId) {
//     return res.status(400).json({ error: 'User ID is required' });
//   }

//   const normalizedItems = Array.isArray(items) ? items : [];

//   if (normalizedItems.length === 0) {
//     return res.status(400).json({ error: 'No cart items provided' });
//   }

//   const productIds = normalizedItems
//     .map((item) => item.productId || item.id || item.product_id)
//     .filter(Boolean)
//     .join(',');

//   const totalQuantity = normalizedItems.reduce(
//     (sum, item) => sum + (Number(item.quantity) || 1),
//     0
//   );

//   const totalPrice = normalizedItems.reduce(
//     (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
//     0
//   );

//   const sql = `
//     INSERT INTO cart_items (user_id, product_ids, quantity, price)
//     VALUES (?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE product_ids = ?, quantity = ?, price = ?
//   `;

//   db.query(
//     sql,
//     [userId, productIds, totalQuantity, totalPrice, productIds, totalQuantity, totalPrice],
//     (err) => {
//       if (err) {
//         return res.status(500).json({ error: 'Failed to save cart item', details: err });
//       }
//       res.json({ success: true, message: 'Cart synced successfully' });
//     }
//   );
// });

// // Clear a user's cart entirely
// router.delete('/cart-items/:userId', (req, res) => {
//   const { userId } = req.params;

//   db.query('DELETE FROM cart_items WHERE user_id = ?', [userId], (err, result) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to clear cart items', details: err });
//     }
//     res.json({ success: true, deletedRows: result.affectedRows });
//   });
// });

// module.exports = router;


const express = require('express');
const db = require('../db');
const router = express.Router();

// GET all cart items (admin), or a single user's cart if ?userId= is passed.
// cart_items has no product_name column, so the display name comes from a join.
router.get('/cart-items', (req, res) => {
  const userId = req.query.userId;
  const base = `SELECT ci.id, ci.user_id, ci.product_id, p.pname AS product_name,
                       ci.quantity, ci.price, ci.created_at
                FROM cart_items ci
                LEFT JOIN product p ON p.id = ci.product_id`;
  const sql = userId
    ? `${base} WHERE ci.user_id = ? ORDER BY ci.created_at DESC`
    : `${base} ORDER BY ci.created_at DESC`;

  db.query(sql, userId ? [userId] : [], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch cart items', details: err });
    }
    res.json(results);
  });
});

// ADD one item — called every time "Add to Cart" is clicked on the home page.
// If the product is already in that user's cart, bump the quantity instead of duplicating.
// cart_items has no product_name column, so it is not stored here.
router.post('/cart-items/add', (req, res) => {
  const { userId, productId, price, quantity } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId are required' });
  }

  const qty = Number(quantity) || 1;
  const unitPrice = Number(price) || 0;

  const sql = `
    INSERT INTO cart_items (user_id, product_id, quantity, price)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;

  db.query(sql, [userId, productId, qty, unitPrice], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add cart item', details: err });
    }
    res.json({ success: true, message: 'Item added to cart' });
  });
});

// REMOVE one item entirely — called when "Remove" is clicked on the cart page.
router.delete('/cart-items/remove/:userId/:productId', (req, res) => {
  const { userId, productId } = req.params;

  db.query(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove cart item', details: err });
      }
      res.json({ success: true, deletedRows: result.affectedRows });
    }
  );
});

// UPDATE quantity — called when +/- is clicked on the cart page.
// Deletes the row if quantity drops to 0 or below.
router.put('/cart-items/quantity', (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId are required' });
  }

  const qty = Number(quantity);

  if (qty <= 0) {
    db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to remove cart item', details: err });
        }
        res.json({ success: true, deletedRows: result.affectedRows });
      }
    );
    return;
  }

  db.query(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
    [qty, userId, productId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update quantity', details: err });
      }
      res.json({ success: true });
    }
  );
});

// Clear a user's entire cart (kept for checkout flow)
router.delete('/cart-items/:userId', (req, res) => {
  const { userId } = req.params;

  db.query('DELETE FROM cart_items WHERE user_id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear cart items', details: err });
    }
    res.json({ success: true, deletedRows: result.affectedRows });
  });
});

router.get('/categoriesUser', (req, res) => {
  const query = `
    SELECT 
      category.id AS categoryId, 
      category.name AS categoryName, 
      product.id AS itemId, 
      product.pname, 
      product.description, 
      product.price, 
      product.image
    FROM category
    LEFT JOIN product ON category.id = product.categoryid;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: 'Failed to fetch data' });
    }

    const categories = results.reduce((acc, row) => {
      const { categoryId, categoryName, itemId, pname, description, price, image } = row;

      if (!acc[categoryId]) {
        acc[categoryId] = { id: categoryId, name: categoryName, items: [] };
      }

      if (itemId) {
        acc[categoryId].items.push({
          id: itemId,
          name: pname,
          description,
          price,
          image,
        });
      }

      return acc;
    }, {});

    res.json(Object.values(categories));
  });
});


module.exports = router;