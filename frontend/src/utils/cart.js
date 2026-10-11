import { useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

// ---------------------------------------------------------------------------
// Shared cart actions for Home.js and WatchDetails.js.
//
// This is the handleAddToCart / handleBuyNow logic that used to live inline in
// Home.js, moved here unchanged in behaviour:
//   * addToCart -> CartContext.addItem (localStorage guest merge + server cart
//     via the API) with a quantity argument defaulting to 1, plus success/error
//     toasts.
//   * buyNow -> navigates to /buy-now with state
//     { productName, price, productId, quantity } (BUY NOW keeps working the
//     same way it does today).
// ---------------------------------------------------------------------------

export function useCartActions() {
  const { addItem } = useCart();
  const toast = useToast();

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      const result = await addItem(product, quantity);
      if (result?.ok) {
        toast.success(`${product.name} added to cart`);
      } else {
        toast.error(result?.message || 'Could not add to cart');
      }
      return result;
    },
    [addItem, toast]
  );

  const buyNow = useCallback((navigate, product, quantity = 1) => {
    navigate('/buy-now', {
      state: {
        productName: product.name,
        price: product.price,
        productId: product.id,
        quantity: quantity || 1,
      },
    });
  }, []);

  return { addToCart, buyNow };
}

export default useCartActions;
