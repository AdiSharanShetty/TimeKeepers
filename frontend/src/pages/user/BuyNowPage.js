import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../style.css';
import { placeDirectOrder, placeOrder } from '../../api/orders';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import * as authApi from '../../api/auth';

function BuyNowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { clear } = useCart();

  const fromCart = Boolean(location.state?.fromCart);
  const quantityFromState = Number(location.state?.quantity || 1);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    quantity: quantityFromState.toString(),
    paymentMethod: 'Cash on Delivery',
    notes: ''
  });

  useEffect(() => {
    const nextQuantity = Number(location.state?.quantity || 1);
    if (Number.isFinite(nextQuantity) && nextQuantity > 0) {
      setFormData((prev) => ({ ...prev, quantity: String(nextQuantity) }));
    }
  }, [location.state?.quantity]);

  // Prefill contact details from the logged-in user when available.
  useEffect(() => {
    const user = authApi.getStoredUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const user = authApi.getStoredUser();
    if (!user || !user.id) {
      toast.error('Please log in before placing an order.');
      navigate('/');
      return;
    }

    const quantity = Number(formData.quantity || 1);

    // Direct Buy Now (single product, NOT from the cart): order the product
    // itself — never depend on or mutate the cart. Works even when the cart
    // is empty.
    if (!fromCart && location.state?.productId) {
      try {
        await placeDirectOrder({
          productId: Number(location.state.productId),
          quantity,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod,
        });

        toast.success(`Thank you, ${formData.fullName || 'customer'}! Your order has been received.`);
        navigate('/orders');
      } catch (error) {
        console.error('Failed to create order:', error);
        toast.error(error?.message || 'Your order could not be placed right now. Please try again.');
      }
      return;
    }

    // Checkout from the cart: the backend builds the order from the
    // server-side cart (login required to have one).
    try {
      await placeOrder({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        quantity,
      });

      // The backend clears the server cart on order placement; clear local state too.
      await clear();

      toast.success(`Thank you, ${formData.fullName || 'customer'}! Your order has been received.`);
      navigate('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error?.message || 'Your order could not be placed right now. Please try again.');
    }
  };


  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <button type="button" onClick={() => navigate('/Home')} style={{ marginBottom: '16px', border: 'none', background: 'transparent', color: '#a67c00', cursor: 'pointer', fontWeight: '600' }}>
          ← Back to Home
        </button>

        <h2 style={{ marginBottom: '8px' }}>Buy Now</h2>
        <p style={{ marginBottom: '24px', color: '#555' }}>
          Please provide your details to purchase <strong>{location.state?.productName || 'your selected items'}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Shipping Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, quantity: String(Math.max(1, Number(prev.quantity || 1) - 1)) }))}
                    style={{ border: '1px solid #ddd', background: '#fff', width: '36px', height: '38px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    −
                  </button>
                  <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleChange} required style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, quantity: String((Number(prev.quantity || 1)) + 1) }))}
                    style={{ border: '1px solid #ddd', background: '#fff', width: '36px', height: '38px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={inputStyle}>
                  <option>Cash on Delivery</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Additional Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: '24px', background: '#a67c00', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
            Confirm Order
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px'
};

export default BuyNowPage;
