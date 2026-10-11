import api, { toApiError } from './client';

// Orders API calls, built against the Section 5 contract:
//   POST /orders        -> body: shipping/contact details; builds order from the
//                          server-side cart, clears the cart, returns the order
//   GET  /orders/mine   -> current user's orders, newest first
//   GET  /orders/:id    -> owner or admin only
//
// Admin (auth + admin role required; else 403):
//   GET   /admin/orders?status=&page=&limit=
//   GET   /admin/orders/:id
//   PATCH /admin/orders/:id/status  body { status }

export async function placeOrder(details) {
  try {
    const { data } = await api.post('/orders', details);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

// Direct single-product order (Buy Now WITHOUT going through the cart).
// Backend builds the order from { productId, quantity } + contact/shipping
// fields in the body — it does not read or require the server cart.
export async function placeDirectOrder(details) {
  try {
    const { data } = await api.post('/orders/legacy-single', details);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getMyOrders() {
  try {
    const { data } = await api.get('/orders/mine');
    return Array.isArray(data) ? data : data?.orders ?? [];
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getOrder(id) {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getAdminOrders({ status, page = 1, limit = 20 } = {}) {
  try {
    const { data } = await api.get('/admin/orders', {
      params: { status, page, limit },
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getAdminOrder(id) {
  try {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateOrderStatus(id, status) {
  try {
    const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
