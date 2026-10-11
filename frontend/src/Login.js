import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  LoginOutlined,
  Watch,
} from '@mui/icons-material';
import './Auth.css';
import './AuthRedesign.css';
import AuthShowcase from './Component/AuthShowcase';
import { login } from './api/auth';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { applyLogin } = useCart();
  const toast = useToast();

  const emailValid = email.trim() === '' || EMAIL_RE.test(email.trim());
  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0 && !loading;

  const handleKeyDown = (event) => {
    const caps = event.getModifierState && event.getModifierState('CapsLock');
    setCapsOn(Boolean(caps));
  };

  const shake = () => {
    const shell = document.querySelector('.auth-shell');
    if (!shell) return;
    shell.classList.remove('auth-shake');
    // Force reflow so the animation replays on repeated failures.
    void shell.offsetWidth;
    shell.classList.add('auth-shake');
  };

  const handleLogin = async (event) => {
    event?.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) {
      if (!EMAIL_RE.test(email.trim())) setError('Enter a valid email address to continue.');
      else if (!password) setError('Enter your password to continue.');
      shake();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      // Merge any guest cart into the saved (server) cart for this user.
      await applyLogin();
      toast.success(`Welcome back${user?.name ? `, ${user.name}` : ''}!`);

      // Redirect based on role.
      if (user.role === 'admin') {
        navigate('AdminDash');
      } else if (user.role === 'user') {
        navigate('/Home');
      } else {
        setError('Your account role was not recognised. Please contact support.');
        shake();
      }
    } catch (err) {
      setError(err?.message || 'Invalid credentials. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-luxe">
      <div className="auth-compact-brand">
        <Watch fontSize="small" />
        TIME <small>KEEPERS</small>
      </div>

      <div className="auth-shell">
        <AuthShowcase
          headline={<>Time, <em>perfected.</em></>}
          sub="Sign in to sync your cart, track orders and check out faster."
        />

        <section className="auth-form-side">
          <nav className="auth-tabs" aria-label="Log in or sign up">
            <span className="auth-tab is-current" aria-current="page">Log in</span>
            <a className="auth-tab" href="/register">Sign up</a>
          </nav>

          <span className="auth-eyebrow">Member access</span>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-lead">Log in to your TIMEKEEPERS account.</p>

          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-email">Email</label>
              <TextField
                id="login-email"
                type="email"
                value={email}
                autoComplete="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={touched.email && !emailValid}
                helperText={touched.email && !emailValid ? 'That email does not look right.' : ''}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-password">Password</label>
              <TextField
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                placeholder="Your password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                onBlur={() => {
                  setTouched((t) => ({ ...t, password: true }));
                  setCapsOn(false);
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            {capsOn && password.length > 0 && (
              <p className="auth-hint">Caps Lock is on — passwords are case-sensitive.</p>
            )}

            {error && (
              <Alert severity="error" className="auth-error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing you in…
                </>
              ) : (
                <>
                  <LoginOutlined fontSize="small" />
                  Login
                </>
              )}
            </button>

            <div className="auth-row">
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => toast.info('Password reset is coming soon. Please contact support.')}
              >
                Forgot password?
              </button>
            </div>
          </form>

          <p className="auth-fineprint">Authentic pieces · Secure checkout · Since 2026</p>
        </section>
      </div>
    </div>
  );
}

export default Login;
