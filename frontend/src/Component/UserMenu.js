import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useCart } from '../context/CartContext';

function UserMenu() {
  const navigate = useNavigate();
  const { applyLogout } = useCart();
  const [userName, setUserName] = useState('User');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const user = authApi.getStoredUser();
    if (user?.name) {
      setUserName(user.name);
    } else {
      const storedName = localStorage.getItem('user_name');
      if (storedName) setUserName(storedName);
    }
  }, []);

  const handleLogout = () => {
    // Clear auth + in-memory cart state. The SERVER cart is intentionally left
    // intact so it is restored on the next login.
    authApi.logout();
    applyLogout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div style={{ position: 'relative', marginLeft: '12px' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: '#C29B0C',
          color: '#111',
          border: '1px solid #000000',
          borderRadius: '999px',
          padding: '8px 14px',
          cursor: 'pointer',
          fontWeight: '700',
          whiteSpace: 'nowrap'
        }}
      >
        {`${userName}`}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', minWidth: '140px', zIndex: 20 }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
