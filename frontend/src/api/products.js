import api, { toApiError } from './client';

// Product + search API calls. Built against the Section 5 contract:
//   GET /products                -> Product[]            (each incl. id, name, brand, price, description, image, stock)
//   GET /products/search?q=text  -> { results: Product[], count }
//   GET /products/:id            -> Product
//
// NOTE: the live backend currently exposes `/product/fetch-product` (snake-ish
// field names: pname, image, price...). Until the Section 5 `/products` routes are
// live, `listProducts()` falls back to the existing endpoint and normalises the
// shape so the rest of the app can rely on one product shape.

function normalizeProduct(p) {
  if (!p) return p;
  return {
    id: p.id,
    name: p.name ?? p.pname ?? '',
    brand: p.brand ?? '',
    description: p.description ?? '',
    price: Number(p.price ?? 0),
    image: p.image ?? null,
    stock: p.stock ?? null,
    category: p.category ?? null,
    // keep the original around for admin screens that need raw fields
    raw: p,
  };
}

function normalizeList(payload) {
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.data)
    ? payload.data
    : [];
  return arr.map(normalizeProduct);
}

export async function listProducts() {
  try {
    const { data } = await api.get('/products');
    return normalizeList(data);
  } catch (error) {
    // Fall back to the currently-live endpoint while Section 5 routes are built.
    if (error?.response?.status === 404) {
      const { data } = await api.get('/product/fetch-product');
      return normalizeList(data);
    }
    throw toApiError(error);
  }
}

export async function getProduct(id) {
  try {
    const { data } = await api.get(`/products/${id}`);
    return normalizeProduct(data);
  } catch (error) {
    if (error?.response?.status === 404) {
      const { data } = await api.get(`/product/${id}`);
      return normalizeProduct(data);
    }
    throw toApiError(error);
  }
}

/**
 * Search products by free text. Returns { results, count }.
 * Falls back to a client-side filter over listProducts() if the dedicated
 * search endpoint is not live yet, so the UI always works.
 */
export async function searchProducts(query) {
  const q = (query ?? '').trim();

  // Empty query: return everything (documented behaviour).
  if (!q) {
    const all = await listProducts();
    return { results: all, count: all.length };
  }

  try {
    const { data } = await api.get('/products/search', { params: { q } });
    const results = normalizeList(data);
    return { results, count: data?.count ?? results.length };
  } catch (error) {
    if (error?.response?.status === 404) {
      const all = await listProducts();
      const needle = q.toLowerCase();
      const results = all.filter((p) =>
        [p.name, p.brand, p.description]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(needle))
      );
      return { results, count: results.length };
    }
    throw toApiError(error);
  }
}
