import { useEffect, useReducer } from 'react';
import { listProducts } from '../api/products';

// ---------------------------------------------------------------------------
// useProducts — shared product list loader.
//
// Fetches GET /api/products ONCE (module-level cache) and shares the result
// with every consumer: the Home grid, the WatchDetails page and (later) the
// search dropdown. Consumers all see the same products/loading/error state and
// only one request is made, no matter how many components mount.
// ---------------------------------------------------------------------------

let products = [];
let loading = true; // start as "loading" so the first paint shows the loader
let error = null;
let pendingPromise = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function load() {
  if (pendingPromise) return pendingPromise;

  loading = true;
  error = null;
  notify();

  pendingPromise = listProducts()
    .then((data) => {
      products = Array.isArray(data) ? data : [];
      error = null;
    })
    .catch((err) => {
      error = err?.message || 'Failed to load products.';
    })
    .finally(() => {
      loading = false;
      pendingPromise = null;
      notify();
    });

  return pendingPromise;
}

/**
 * Shared hook over the product catalogue.
 * @returns {{products: Array, loading: boolean, error: string|null, reload: Function}}
 */
export default function useProducts() {
  const [, forceRender] = useReducer((tick) => tick + 1, 0);

  useEffect(() => {
    listeners.add(forceRender);
    return () => {
      listeners.delete(forceRender);
    };
  }, []);

  useEffect(() => {
    load();
  }, []);

  return { products, loading, error, reload: load };
}
