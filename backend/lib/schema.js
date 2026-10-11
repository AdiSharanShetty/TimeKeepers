// Lightweight schema introspection with a process-level cache.
// Used so routes can adapt to optional columns added by
// scripts/migrateOrderColumns.js without failing if that script has not run.

const db = require('../db');
const cache = {};

function hasColumn(table, column) {
  return new Promise((resolve, reject) => {
    const key = `${table}.${column}`;
    if (Object.prototype.hasOwnProperty.call(cache, key)) return resolve(cache[key]);
    db.query(
      'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column],
      (err, rows) => {
        if (err) return reject(err);
        cache[key] = rows[0].n > 0;
        resolve(cache[key]);
      }
    );
  });
}

module.exports = { hasColumn };
