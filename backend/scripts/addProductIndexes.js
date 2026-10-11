// Idempotent: add a FULLTEXT index on product(pname, description) to support
// fast text search as the catalog grows. MySQL 5.6+ / InnoDB supports FULLTEXT.
// If the server/engine does not support it, the script logs and continues
// (the search endpoint uses safe LIKE matching and still works).
//
// Run: `node scripts/addProductIndexes.js`

const db = require('../db');

const INDEX_NAME = 'ft_product_search';

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function indexExists() {
  const rows = await query(
    'SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    ['product', INDEX_NAME]
  );
  return rows[0].n > 0;
}

async function main() {
  if (await indexExists()) {
    console.log(`OK    index ${INDEX_NAME} already exists on product`);
    return;
  }
  try {
    await query(`ALTER TABLE product ADD FULLTEXT INDEX ${INDEX_NAME} (pname, description)`);
    console.log(`ADDED FULLTEXT index ${INDEX_NAME} on product(pname, description)`);
  } catch (err) {
    console.log(`SKIP  could not add FULLTEXT index (${err.message}). LIKE search still works.`);
  }
}

main()
  .then(() => db.end())
  .catch((err) => {
    console.error('Index migration failed:', err.message);
    db.end();
    process.exitCode = 1;
  });
