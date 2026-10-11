import api, { toApiError, setToken, getToken } from './client';

// Auth helpers. The current backend returns { id, name, role } on login with no
// token; the app stores user info in localStorage. When the backend starts issuing
// a token we capture it here automatically (no UI changes needed).
//
// We keep BOTH the structured `user` object (read by api/client for the x-user-id
// header) AND the legacy flat keys (`user_id`, `user_name`, `user_email`,
// `user_role`) that the rest of the existing app already reads, so nothing breaks.

const USER_KEY = 'user';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      // Mirror into the legacy flat keys used across the existing screens.
      if (user.id != null) localStorage.setItem('user_id', String(user.id));
      if (user.name != null) localStorage.setItem('user_name', user.name);
      if (user.email != null) localStorage.setItem('user_email', user.email);
      if (user.role != null) localStorage.setItem('user_role', user.role);
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function isAdmin() {
  return getStoredUser()?.role === 'admin';
}

export function logout() {
  // Clear in-memory / stored auth only. Do NOT delete the server cart here —
  // logging back in must restore it.
  setStoredUser(null);
  setToken(null);
  try {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
  } catch {
    /* ignore */
  }
}

export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    const user = {
      id: data.id ?? data.user?.id,
      name: data.name ?? data.user?.name ?? email,
      email,
      role: data.role ?? data.user?.role,
    };
    if (data.token) setToken(data.token);
    setStoredUser(user);
    return user;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function register({ name, email, password, role = 'user' }) {
  try {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export { getToken };

