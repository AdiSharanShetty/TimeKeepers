import axios from 'axios';

// Central axios instance for the whole app.
//
// Base URL points at the backend API (defaults to the local dev server and can be
// overridden with a REACT_APP_API_URL env var). Keeping this in one place means we
// stop hardcoding `http://localhost:5000` across ~20 call sites and can identify the
// current user in exactly one spot.
//
// AUTH (Phase 0 decision, agreed with backend): the project has no token/JWT
// system. The client identifies the user by sending an `x-user-id` header on every
// request. Backend middleware `requireUser` validates the user exists (else 401) and
// `requireAdmin` also requires role === 'admin' (else 403). We read the id from the
// stored user (set at login) or the guest id fallback.

const RAW_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'http://localhost:5000';

export const API_BASE_URL = `${RAW_BASE_URL.replace(/\/$/, '')}/api`;

const USER_KEY = 'user';
const LEGACY_USER_ID_KEY = 'user_id';

// Resolve the current user id for the x-user-id header. Prefers the structured user
// object written at login; falls back to the legacy `user_id` localStorage key.
export function getCurrentUserId() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && (user.id || user.userId)) {
        return user.id ?? user.userId;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const legacy = localStorage.getItem(LEGACY_USER_ID_KEY);
    if (legacy && legacy !== 'null' && legacy !== 'undefined') {
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Optional token support (kept for forward-compatibility if a token is added later).
const TOKEN_KEY = 'auth_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore storage errors (e.g. private mode) */
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  const userId = getCurrentUserId();
  if (userId != null) {
    config.headers['x-user-id'] = userId;
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normalise any thrown error into a friendly message plus the HTTP status (if any),
 * so callers can show good UX without repeating try/catch boilerplate.
 */
export function toApiError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message =
    (data && (data.error || data.message)) ||
    error?.message ||
    'Something went wrong. Please try again.';
  return { status, message, raw: error };
}

export default api;
