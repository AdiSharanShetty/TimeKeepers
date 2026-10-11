// Idempotent repair of the `cart_items` table.
//
// The live schema was created with `id INT NOT NULL PRIMARY KEY` (no
// AUTO_INCREMENT) and a single-column UNIQUE key on `user_id`. The cart routes
// omit `id` on INSERT and upsert per (user_id, product_id), so every add fails
// with a 500 and a second product for the same user collides on `user_id`.
//
// This makes the schema match what the routes assume:
//   * id              -> INT AUTO_INCREMENT PRIMARY KEY
//   * UNIQUE KEY      -> (user_id, product_id)
//
// Safe to run repeatedly. Called automatically on server start (app.js) and
// available as a script (scripts/migrateCartItems.js).

const db = require('../db');

const TABLE = 'cart_items';

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

async function tableExists(table) {
  const rows = await q(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return rows[0].n > 0;
}

async function getColumns(table) {
  return q(
    'SELECT COLUMN_NAME, COLUMN_KEY, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
}

async function getIndexes(table) {
  const rows = await q(
    'SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX',
    [table]
  );
  const byName = {};
  for (const row of rows) {
    if (!byName[row.INDEX_NAME]) {
      byName[row.INDEX_NAME] = { name: row.INDEX_NAME, unique: row.NON_UNIQUE === 0, columns: [] };
    }
    byName[row.INDEX_NAME].columns.push(row.COLUMN_NAME);
  }
  return Object.values(byName);
}

async function ensureAutoIncrementId() {
  const columns = await getColumns(TABLE);
  const idCol = columns.find((c) => c.COLUMN_NAME === 'id');
  if (!idCol) {
    console.log(`[cart-schema] no "id" column on ${TABLE}; skipping id fix.`);
    return [];
  }

  const isAuto = String(idCol.EXTRA || '').toLowerCase().includes('auto_increment');
  const isPk = String(idCol.COLUMN_KEY || '').toUpperCase() === 'PRI';
  if (isAuto && isPk) return [];

  const changes = [];
  if (!isPk) {
    const pk = (await getIndexes(TABLE)).find((i) => i.name === 'PRIMARY');
    if (pk) {
      await q(`ALTER TABLE ${TABLE} DROP PRIMARY KEY`);
      changes.push(`dropped PRIMARY KEY (${pk.columns.join(', ')})`);
    }
  }
  await q(`ALTER TABLE ${TABLE} MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT`);
  if (!isPk) {
    await q(`ALTER TABLE ${TABLE} ADD PRIMARY KEY (id)`);
  }
  changes.push('id -> AUTO_INCREMENT PRIMARY KEY');
  return changes;
}

async function ensureUserProductUnique() {
  const indexes = await getIndexes(TABLE);
  const hasComposite = indexes.some(
    (i) =>
      i.unique &&
      i.columns.length === 2 &&
      i.columns[0] === 'user_id' &&
      i.columns[1] === 'product_id'
  );
  if (hasComposite) return [];

  const changes = [];
  for (const idx of indexes) {
    if (idx.unique && idx.columns.length === 1 && idx.columns[0] === 'user_id') {
      await q(`ALTER TABLE ${TABLE} DROP INDEX ${idx.name}`);
      changes.push(`dropped single-column unique ${idx.name}(user_id)`);
    }
  }

  // Merge any duplicate (user_id, product_id) rows so the new unique key can be
  // added without error (sums quantities into the oldest row).
  await q(
    `UPDATE ${TABLE} ci
       JOIN (
         SELECT user_id, product_id, MIN(id) AS keep_id, SUM(quantity) AS total_qty
         FROM ${TABLE}
         GROUP BY user_id, product_id
         HAVING COUNT(*) > 1
       ) dup ON ci.id = dup.keep_id
        SET ci.quantity = LEAST(dup.total_qty, 99)`
  );
  await q(
    `DELETE ci FROM ${TABLE} ci
       JOIN (
         SELECT user_id, product_id, MIN(id) AS keep_id
         FROM ${TABLE}
         GROUP BY user_id, product_id
         HAVING COUNT(*) > 1
       ) dup ON ci.user_id = dup.user_id
             AND ci.product_id = dup.product_id
             AND ci.id <> dup.keep_id`
  );

  await q(`ALTER TABLE ${TABLE} ADD UNIQUE KEY unique_user_product (user_id, product_id)`);
  changes.push('added UNIQUE (user_id, product_id)');
  return changes;
}

async function ensureCartSchema() {
  if (!(await tableExists(TABLE))) {
    console.log(`[cart-schema] table ${TABLE} does not exist; skipping.`);
    return;
  }
  const changes = [];
  changes.push(...(await ensureAutoIncrementId()));
  changes.push(...(await ensureUserProductUnique()));
  if (changes.length === 0) {
    console.log('[cart-schema] cart_items schema OK');
  } else {
    console.log(`[cart-schema] repaired: ${changes.join('; ')}`);
  }
}

module.exports = { ensureCartSchema };
