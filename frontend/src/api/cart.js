import api, { toApiError, getCurrentUserId } from './client';

// Cart API calls, built against the Section 5 contract:
//   GET   /cart                      -> { items: [{ product, quantity }], subtotal }
//   POST  /cart/items                -> { productId, quantity } => updated cart
//   PATCH /cart/items/:productId     -> { quantity } => updated cart
//   DELETE /cart/items/:productId    -> updated cart
//   DELETE /cart                     -> empty cart
//   POST  /cart/merge                -> { items: [{ productId, quantity }] } => merged cart
//
// The cart is keyed to the logged-in user on the server. For guests we still keep a
// local copy (see CartContext) and merge it into the server cart on login.
//
// The backend identifies the user from the `x-user-id` header (attached by the
// shared api client) OR a `userId` field in the body/query. We send both so a
// dropped/stripped header can never turn a valid cart call into a 401.

export async function getCart() {
  try {
    const { data } = await api.get('/cart', { params: { userId: getCurrentUserId() } });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function addCartItem(productId, quantity = 1) {
  try {
    const { data } = await api.post('/cart/items', {
      productId,
      quantity,
      userId: getCurrentUserId(),
    });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateCartItem(productId, quantity) {
  try {
    const { data } = await api.patch(`/cart/items/${productId}`, {
      quantity,
      userId: getCurrentUserId(),
    });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function removeCartItem(productId) {
  try {
    const { data } = await api.delete(`/cart/items/${productId}`, {
      data: { userId: getCurrentUserId() },
    });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function clearCart() {
  try {
    const { data } = await api.delete('/cart', { data: { userId: getCurrentUserId() } });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function mergeGuestCart(items) {
  try {
    const { data } = await api.post('/cart/merge', { items, userId: getCurrentUserId() });
    return normalizeCart(data);
  } catch (error) {
    throw toApiError(error);
  }
}

// ---- helpers ----

function normalizeItem(item) {
  const product = item.product ?? item;
  const quantity = Number(item.quantity ?? 1);
  const price = Number(product.price ?? item.price ?? 0);
  return {
    productId: product.id ?? item.productId ?? item.product_id,
    name: product.name ?? product.pname ?? item.name ?? item.product_name ?? '',
    image: product.image ?? item.image ?? null,
    price,
    quantity,
    lineTotal: price * quantity,
    product,
  };
}

function normalizeCart(data) {
  const items = Array.isArray(data?.items)
    ? data.items.map(normalizeItem)
    : Array.isArray(data)
    ? data.map(normalizeItem)
    : [];
  const subtotal =
    data?.subtotal != null
      ? Number(data.subtotal)
      : items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal };
}
