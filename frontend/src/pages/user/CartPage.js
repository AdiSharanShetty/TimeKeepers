import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../../Component/ProductImage';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

// Cart page driven entirely by CartContext.
//  * Logged-in users: the cart lives on the server (persists across logout/login
//    and devices). Guests: a local cart that merges into the server cart on login.
//  * Quantity +/- and Remove call the API (with optimistic UI + rollback) for
//    logged-in users, or update the local guest cart otherwise.
function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, subtotal, loading, updateQuantity, removeItem, clear, isLoggedIn } = useCart();

  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    navigate('/buy-now', { state: { fromCart: true, quantity: totalQuantity } });
  };

  const handleClear = async () => {
    const result = await clear();
    if (result?.ok) toast.info('Cart cleared');
    else toast.error(result?.message || 'Could not clear cart');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <button type="button" onClick={() => navigate('/Home')} style={{ marginBottom: '16px', border: 'none', background: 'transparent', color: '#a67c00', cursor: 'pointer', fontWeight: '600' }}>
          ← Continue Shopping
        </button>

        <h2 style={{ marginBottom: '8px' }}>Your Cart</h2>
        <p style={{ marginBottom: '8px', color: '#555' }}>
          These are the items you have added for purchase.
        </p>
        {!isLoggedIn && (
          <p style={{ marginBottom: '24px', color: '#a67c00', fontSize: 14 }}>
            You're shopping as a guest. <strong>Log in</strong> to save your cart to your account.
          </p>
        )}

        {loading && items.length === 0 ? (
          <div style={{ padding: '24px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center', color: '#777' }}>
            Loading your cart…
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '24px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center', color: '#777' }}>
            Your cart is empty.
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid #eee', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                <ProductImage
                  image={item.image}
                  alt={item.name}
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px' }}>{item.name}</h4>
                  <p style={{ margin: 0, color: '#777' }}>${Number(item.price || 0).toLocaleString()} each</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ border: '1px solid #ddd', background: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer' }}>
                      −
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ border: '1px solid #ddd', background: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '700' }}>${(item.price * item.quantity).toLocaleString()}</p>
                  <button type="button" onClick={() => removeItem(item.productId)} style={{ border: 'none', background: '#a67c00', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Total</strong>
              <strong>${subtotal.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" onClick={handleCheckout} style={{ background: '#111', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                Proceed to Checkout
              </button>
              <button type="button" onClick={handleClear} style={{ background: 'transparent', color: '#c0392b', border: '1px solid #c0392b', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
