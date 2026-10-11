import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as cartApi from '../api/cart';
import * as authApi from '../api/auth';
import { toApiError } from '../api/client';

// ---------------------------------------------------------------------------
// CartContext
//
// Owns all cart state for the app and keeps it in sync with the database so the
// cart survives logout/login, restarts and device changes.
//
// Behaviour:
//  * Guests keep a LOCAL cart in localStorage (key: guest_cart_items).
//  * When a user is logged in, the cart lives on the SERVER and is loaded on app
//    start (and on login). Every add/update/remove calls the API.
//  * On login we call the merge endpoint to fold the guest cart into the saved
//    server cart, then clear the local copy.
//  * Logout clears in-memory state ONLY. It must NOT delete the server cart.
//  * UI updates are optimistic and roll back if the API call fails.
// ---------------------------------------------------------------------------

const GUEST_CART_KEY = 'guest_cart_items';

const CartContext = createContext(null);

function readGuestCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* ignore */
  }
}

// Normalise a server/local cart item into one consistent shape for the UI.
function normalizeItem(item) {
  const product = item.product ?? item;
  const price = Number(product.price ?? item.price ?? 0);
  const quantity = Number(item.quantity ?? 1);
  return {
    productId: product.id ?? item.productId ?? item.product_id,
    name: product.name ?? product.pname ?? item.name ?? item.product_name ?? '',
    image: product.image ?? item.image ?? null,
    price,
    quantity,
    product,
  };
}

function normalizeCart(data) {
  const rawItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];
  const items = rawItems.map(normalizeItem);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, subtotal, count };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!authApi.getStoredUser());

  // Tracks whether we've already merged the guest cart for the current session so
  // we don't re-merge on every re-render/refresh.
  const mergedRef = useRef(false);

  // ---- server sync ----
  const refreshFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.getCart();
      setCart(normalizeCart(data));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- guest (local) helpers ----
  const loadGuestCart = useCallback(() => {
    setCart(normalizeCart({ items: readGuestCart() }));
  }, []);

  // ---- login / logout wiring ----
  const applyLogin = useCallback(async () => {
    setIsLoggedIn(true);
    mergedRef.current = false;
    const guestItems = readGuestCart();

    if (guestItems.length > 0 && !mergedRef.current) {
      mergedRef.current = true;
      setLoading(true);
      try {
        const merged = await cartApi.mergeGuestCart(
          guestItems.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity) || 1,
          }))
        );
        clearGuestCart();
        setCart(normalizeCart(merged));
        setError(null);
        return;
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setLoading(false);
      }
    }

    await refreshFromServer();
  }, [refreshFromServer]);

  const applyLogout = useCallback(() => {
    // Clear in-memory state only; the server cart stays intact for next login.
    setIsLoggedIn(false);
    mergedRef.current = false;
    setCart({ items: [], subtotal: 0, count: 0 });
    setError(null);
    clearGuestCart();
  }, []);

  // Load the right cart on first mount.
  useEffect(() => {
    if (authApi.getStoredUser()) {
      refreshFromServer();
    } else {
      loadGuestCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- mutations ----
  const addItem = useCallback(
    async (product, quantity = 1) => {
      const productId = product.id ?? product.productId;
      const qty = Math.max(1, Number(quantity) || 1);

      // Guests have no server cart (every /cart endpoint requires auth), so
      // write straight to the local guest cart and never call the API.
      // We check the ACTUAL stored user id (not just the in-memory flag) so a
      // stale logged-in flag with cleared storage can never hit the server
      // branch without credentials (which the backend rejects with 401).
      if (!isLoggedIn || !authApi.getStoredUser()?.id) {
        const guest = readGuestCart();
        const idx = guest.findIndex((i) => i.productId === productId);
        if (idx >= 0) {
          guest[idx] = {
            ...guest[idx],
            quantity: (Number(guest[idx].quantity) || 0) + qty,
          };
        } else {
          guest.push({
            productId,
            name: product.name ?? product.pname,
            price: Number(product.price ?? 0),
            image: product.image ?? null,
            quantity: qty,
          });
        }
        writeGuestCart(guest);
        setCart(normalizeCart({ items: guest }));
        return { ok: true };
      }

      const prev = cart;

      // Optimistic update.
      setCart((cur) => {
        const items = [...cur.items];
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        } else {
          items.push(normalizeItem({ product, quantity }));
        }
        return normalizeCart({ items });
      });

      try {
        const updated = await cartApi.addCartItem(productId, qty);
        setCart(normalizeCart(updated));
        return { ok: true };
      } catch (err) {
        const apiError = toApiError(err);
        // If the server says we're unauthenticated, our login state went stale
        // (e.g. storage cleared in another tab). Fall back to guest mode so the
        // item is still saved locally instead of vanishing on rollback.
        if (apiError.status === 401) {
          setIsLoggedIn(false);
          const guest = readGuestCart();
          guest.push({
            productId,
            name: product.name ?? product.pname,
            price: Number(product.price ?? 0),
            image: product.image ?? null,
            quantity: qty,
          });
          writeGuestCart(guest);
          setCart(normalizeCart({ items: guest }));
          setError('You are browsing as a guest. Log in to save your cart.');
          return { ok: true };
        }
        setCart(prev); // roll back
        setError(apiError.message);
        return { ok: false, message: apiError.message };
      }
    },
    [cart, isLoggedIn]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      const prev = cart;
      const qty = Math.max(0, Number(quantity) || 0);

      setCart((cur) => {
        const items =
          qty <= 0
            ? cur.items.filter((i) => i.productId !== productId)
            : cur.items.map((i) =>
                i.productId === productId ? { ...i, quantity: qty } : i
              );
        return normalizeCart({ items });
      });

      if (!isLoggedIn) {
        let guest = readGuestCart();
        guest =
          qty <= 0
            ? guest.filter((i) => i.productId !== productId)
            : guest.map((i) =>
                i.productId === productId ? { ...i, quantity: qty } : i
              );
        writeGuestCart(guest);
        return { ok: true };
      }

      try {
        const updated =
          qty <= 0
            ? await cartApi.removeCartItem(productId)
            : await cartApi.updateCartItem(productId, qty);
        setCart(normalizeCart(updated));
        return { ok: true };
      } catch (err) {
        setCart(prev);
        setError(toApiError(err).message);
        return { ok: false, message: toApiError(err).message };
      }
    },
    [cart, isLoggedIn]
  );

  const removeItem = useCallback(
    (productId) => updateQuantity(productId, 0),
    [updateQuantity]
  );

  const clear = useCallback(async () => {
    const prev = cart;
    setCart({ items: [], subtotal: 0, count: 0 });

    if (!isLoggedIn) {
      clearGuestCart();
      return { ok: true };
    }

    try {
      const updated = await cartApi.clearCart();
      setCart(normalizeCart(updated));
      return { ok: true };
    } catch (err) {
      setCart(prev);
      setError(toApiError(err).message);
      return { ok: false, message: toApiError(err).message };
    }
  }, [cart, isLoggedIn]);

  const value = useMemo(
    () => ({
      items: cart.items,
      subtotal: cart.subtotal,
      count: cart.count,
      loading,
      error,
      isLoggedIn,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refreshFromServer,
      applyLogin,
      applyLogout,
      loadGuestCart,
    }),
    [
      cart,
      loading,
      error,
      isLoggedIn,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refreshFromServer,
      applyLogin,
      applyLogout,
      loadGuestCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return ctx;
}

export default CartContext;

