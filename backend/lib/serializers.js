// Shared row -> API object mappers.
// The DB uses legacy column names (pname, categoryid) and has no brand/stock
// columns; the API contract exposes friendlier fields. Keep mapping in ONE place.

function mapProduct(row) {
  if (!row) return null;
  const name = row.pname != null ? row.pname : row.name || '';
  const derivedBrand = name ? String(name).trim().split(/\s+/)[0] : '';
  return {
    id: row.id,
    name,
    brand: row.brand || derivedBrand,
    price: row.price,
    description: row.description,
    image: row.image,
    stock: row.stock != null ? row.stock : null,
    categoryId: row.categoryid != null ? row.categoryid : row.categoryId,
    featured: row.featured,
  };
}

function mapOrderItem(row) {
  return {
    productId: row.product_id,
    name: row.product_name != null ? row.product_name : row.description,
    image: row.image != null ? row.image : null,
    price: row.price,
    quantity: row.quantity != null ? Number(row.quantity) : 1,
    description: row.description,
  };
}

module.exports = { mapProduct, mapOrderItem };
