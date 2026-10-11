import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/orders';
import { useToast } from '../../context/ToastContext';
import * as authApi from '../../api/auth';
import ProductImage from '../../Component/ProductImage';

// "My Orders" — shows the logged-in user's orders (newest first) with item
// snapshots and status. Orders are read from GET /orders/mine (auth + ownership
// enforced on the server). Requires login.
function MyOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const user = authApi.getStoredUser();
    if (!user || !user.id) {
      toast.error('Please log in to view your orders.');
      navigate('/');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyOrders();
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load your orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'delivered':
        return '#1b8a4b';
      case 'shipped':
        return '#1f6feb';
      case 'paid':
        return '#0a7';
      case 'cancelled':
        return '#c0392b';
      default:
        return '#a67c00';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <button type="button" onClick={() => navigate('/Home')} style={{ marginBottom: '16px', border: 'none', background: 'transparent', color: '#a67c00', cursor: 'pointer', fontWeight: '600' }}>
          ← Continue Shopping
        </button>

        <h2 style={{ marginBottom: '8px' }}>My Orders</h2>
        <p style={{ marginBottom: '24px', color: '#555' }}>Track the orders you've placed.</p>

        {loading && <div style={{ padding: '24px', color: '#777' }}>Loading your orders…</div>}

        {!loading && error && <div style={{ padding: '24px', color: '#c0392b' }}>{error}</div>}

        {!loading && !error && orders.length === 0 && (
          <div style={{ padding: '24px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center', color: '#777' }}>
            You haven't placed any orders yet.
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div>
            {orders.map((order) => {
              const orderItems = order.items || order.ordered_product || [];
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong>Order #{order.id}</strong>
                      <div style={{ color: '#777', fontSize: 13 }}>
                        {order.date ? new Date(order.date).toLocaleString() : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: statusColor(order.status), fontWeight: 700, textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                      <strong>${Number(order.net_total ?? order.total ?? 0).toLocaleString()}</strong>
                      {Array.isArray(orderItems) && orderItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                          style={{ border: '1px solid #ddd', background: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isOpen && Array.isArray(orderItems) && orderItems.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {orderItems.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                          <ProductImage
                            image={it.image}
                            alt={it.name}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <span style={{ flex: 1 }}>{it.name}</span>
                          <span style={{ color: '#777' }}>x{it.quantity ?? 1}</span>
                          <span style={{ fontWeight: 600 }}>
                            ${Number((it.price ?? 0) * (it.quantity ?? 1)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;
