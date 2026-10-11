// Diagnostic: print the real `cart_items` schema so the cart INSERT can be
// matched to it. Run once: `node scripts/describeCartItems.js`
const db = require('../db');

db.query('SHOW COLUMNS FROM cart_items', (err, rows) => {
  if (err) {
    console.error('SHOW COLUMNS failed:', err.message);
    return db.end();
  }
  console.log('cart_items columns:');
  for (const r of rows) {
    console.log(`  ${r.Field}  ${r.Type}  null=${r.Null}  key=${r.Key}  default=${r.Default}`);
  }
  db.query('SHOW INDEX FROM cart_items', (err2, idx) => {
    if (!err2) {
      console.log('cart_items indexes:');
      for (const i of idx) {
        console.log(`  ${i.Key_name} (${i.Column_name}) unique=${i.Non_unique === 0}`);
      }
    }
    db.end();
  });
});
