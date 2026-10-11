// Idempotent migration for the `cart_items` table.
// Run: `node scripts/migrateCartItems.js`
//
// Fixes the schema so the cart routes work:
//   * id           -> INT AUTO_INCREMENT PRIMARY KEY
//   * UNIQUE KEY   -> (user_id, product_id)
//
// Safe to run more than once.

const db = require('../db');
const { ensureCartSchema } = require('../lib/cartSchema');

ensureCartSchema()
  .then(() => db.end())
  .catch((err) => {
    console.error('cart_items migration failed:', err.message);
    db.end();
    process.exitCode = 1;
  });
