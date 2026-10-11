// Idempotent seed: point every product's `image` at the matching file in
// frontend/public/images, using the agreed convention (bare filename, e.g.
// "Rolex_sea_gold.png").
//
// Matching order for each product:
//   1. Exact normalized match of product name -> file base name.
//   2. Loose match (one normalized string contains the other).
//   3. Recover a base name from the current `uploads/<timestamp>-<name>` value
//      and match that.
// Unmatched products and unused files are reported (not fatal).
//
// Run: `node scripts/seedProductImages.js`

const fs = require('fs');
const path = require('path');
const db = require('../db');

const imagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');

const normalize = (value) =>
  String(value || '')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const basenameFromStored = (stored) => {
  if (!stored) return '';
  const base = path.basename(String(stored));
  return base.replace(/^\d+-/, ''); // strip multer timestamp prefix
};

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function readImageFiles() {
  if (!fs.existsSync(imagesDir)) {
    console.log(`images dir not found: ${imagesDir}`);
    return [];
  }
  return fs
    .readdirSync(imagesDir)
    .filter((name) => fs.statSync(path.join(imagesDir, name)).isFile());
}

function findMatch(product, files) {
  const target = normalize(product.pname);
  if (!target) return null;

  for (const file of files) {
    if (normalize(file) === target) return file;
  }
  for (const file of files) {
    const base = normalize(file);
    if (base && (base.includes(target) || target.includes(base))) return file;
  }
  const recovered = normalize(basenameFromStored(product.image));
  if (recovered) {
    for (const file of files) {
      if (normalize(file) === recovered) return file;
    }
  }
  return null;
}

async function main() {
  const files = readImageFiles();
  console.log(`Found ${files.length} image file(s) in ${imagesDir}`);
  if (files.length === 0) {
    console.log('Nothing to match. Populate frontend/public/images first (frontend agent).');
    return;
  }

  const products = await query('SELECT id, pname, image FROM product');
  const usedFiles = new Set();
  let updated = 0;
  const unmatched = [];

  for (const product of products) {
    const match = findMatch(product, files);
    if (!match) {
      unmatched.push(product);
      continue;
    }
    usedFiles.add(match);
    if (product.image !== match) {
      await query('UPDATE product SET image = ? WHERE id = ?', [match, product.id]);
      console.log(`SET   product ${product.id} "${product.pname}" -> ${match}`);
      updated++;
    } else {
      console.log(`OK    product ${product.id} "${product.pname}" already ${match}`);
    }
  }

  const unusedFiles = files.filter((file) => !usedFiles.has(file));

  console.log(`\nUpdated ${updated} product(s).`);
  if (unmatched.length) {
    console.log(`\nProducts with NO matching image (${unmatched.length}):`);
    unmatched.forEach((p) => console.log(`  #${p.id} "${p.pname}" (current: ${p.image || 'none'})`));
  }
  if (unusedFiles.length) {
    console.log(`\nImage files not used by any product (${unusedFiles.length}):`);
    unusedFiles.forEach((f) => console.log(`  ${f}`));
  }
}

main()
  .then(() => db.end())
  .catch((err) => {
    console.error('Seed failed:', err.message);
    db.end();
    process.exitCode = 1;
  });
