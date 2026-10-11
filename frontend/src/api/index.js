// Barrel export for the API layer so screens import from one place:
//   import { listProducts, searchProducts, addCartItem } from '../api';
export { default as api, API_BASE_URL, toApiError, getToken, setToken } from './client';
export * as productsApi from './products';
export * as cartApi from './cart';
export * as ordersApi from './orders';
export * as authApi from './auth';
