// Idempotent migration: add the optional columns the e-commerce flow needs.
//   orders:             shipping_name, shipping_email, shipping_phone,
//                       shipping_address, payment_method, notes
//   order_transactions: product_name, image, quantity
//
// Safe to run repeatedly. Existing rows keep their data; new columns are
// nullable / defaulted. Run: `node scripts/migrateOrderColumns.js`

const db = require('../db');

const MIGRATIONS = [
  { table: 'orders', column: 'shipping_name', ddl: "VARCHAR(255) NULL" },
  { table: 'orders', column: 'shipping_email', ddl: "VARCHAR(255) NULL" },
  { table: 'orders', column: 'shipping_phone', ddl: "VARCHAR(50) NULL" },
  { table: 'orders', column: 'shipping_address', ddl: "TEXT NULL" },
  { table: 'orders', column: 'payment_method', ddl: "VARCHAR(50) NULL" },
  { table: 'orders', column: 'notes', ddl: "TEXT NULL" },
  { table: 'order_transactions', column: 'product_name', ddl: "VARCHAR(255) NULL" },
  { table: 'order_transactions', column: 'image', ddl: "VARCHAR(500) NULL" },
  { table: 'order_transactions', column: 'quantity', ddl: "INT NOT NULL DEFAULT 1" },
];

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function columnExists(table, column) {
  const rows = await query(
    'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0].n > 0;
}

async function tableExists(table) {
  const rows = await query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return rows[0].n > 0;
}

async function main() {
  for (const migration of MIGRATIONS) {
    if (!(await tableExists(migration.table))) {
      console.log(`SKIP  ${migration.table}.${migration.column} (table missing)`);
      continue;
    }
    if (await columnExists(migration.table, migration.column)) {
      console.log(`OK    ${migration.table}.${migration.column} already exists`);
      continue;
    }
    await query(`ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.ddl}`);
    console.log(`ADDED ${migration.table}.${migration.column}`);
  }
  console.log('Migration complete.');
}

main()
  .then(() => db.end())
  .catch((err) => {
    console.error('Migration failed:', err.message);
    db.end();
    process.exitCode = 1;
  });
