import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// ToastContext — tiny toast/snackbar system for non-blocking feedback
// (e.g. "Added to cart", "Removed", error messages). No external dependency.
//
//   const toast = useToast();
//   toast.success('Added to cart');
//   toast.error('Could not update cart');
// ---------------------------------------------------------------------------

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 2600) => {
      const id = ++idCounter;
      setToasts((list) => [...list, { id, message, type }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d),
      info: (m, d) => push(m, 'info', d),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const COLORS = {
  success: '#1b8a4b',
  error: '#c0392b',
  info: '#333',
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => onDismiss(t.id)}
          style={{
            minWidth: 220,
            maxWidth: 340,
            background: '#fff',
            color: COLORS[t.type] || COLORS.info,
            border: `1px solid ${COLORS[t.type] || '#ddd'}`,
            borderLeft: `4px solid ${COLORS[t.type] || '#ddd'}`,
            borderRadius: 8,
            padding: '12px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

export default ToastContext;
