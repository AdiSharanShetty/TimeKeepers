import React, { useMemo, useState } from 'react';
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
  PersonOutline,
  EmailOutlined,
  LockOutlined,
  PersonAddAltOutlined,
  CheckCircleOutline,
  Watch,
} from '@mui/icons-material';
import './Auth.css';
import './AuthRedesign.css';
import AuthShowcase from './Component/AuthShowcase';
import { register } from './api/auth';
import { useToast } from './context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strengthOf(password) {
  if (!password) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const clamped = Math.min(4, score <= 1 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4);
  const steps = [
    { label: 'Weak', color: '#e74c3c' },
    { label: 'Fair', color: '#f0b429' },
    { label: 'Good', color: '#7be2a0' },
    { label: 'Strong', color: '#7be2a0' },
  ];
  return { score: clamped, ...steps[clamped - 1] };
}

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [role] = useState('user');
  const navigate = useNavigate();
  const toast = useToast();

  const strength = useMemo(() => strengthOf(password), [password]);
  const passwordsMatch = confirm.length === 0 || password === confirm;
  const canSubmit =
    name.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 6 &&
    password === confirm &&
    !loading &&
    !done;

  const mark = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleRegister = async (event) => {
    event?.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit) {
      if (name.trim().length < 2) setError('Tell us your name (at least 2 characters).');
      else if (!EMAIL_RE.test(email.trim())) setError('Enter a valid email address.');
      else if (password.length < 6) setError('Use a password of at least 6 characters.');
      else if (password !== confirm) setError('Passwords do not match yet.');
      const shell = document.querySelector('.auth-shell');
      if (shell) {
        shell.classList.remove('auth-shake');
        void shell.offsetWidth;
        shell.classList.add('auth-shake');
      }
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
      setDone(true);
      toast.success('Registration successful — please log in.');
      setTimeout(() => navigate('/'), 1600);
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
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
          headline={<>Join the <em>collectors.</em></>}
          sub="Create an account to save your cart, check out in seconds and follow your orders."
        />

        <section className="auth-form-side">
          <nav className="auth-tabs" aria-label="Log in or sign up">
            <a className="auth-tab" href="/">Log in</a>
            <span className="auth-tab is-current" aria-current="page">Sign up</span>
          </nav>

          <span className="auth-eyebrow">New member</span>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-lead">One account for cart, orders and faster checkout.</p>

          {done ? (
            <div className="auth-success">
              <CheckCircleOutline />
              <h2>You&apos;re in!</h2>
              <p>
                <span className="auth-spinner" aria-hidden="true" />
                Taking you to the login…
              </p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleRegister} noValidate>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="register-name">Full name</label>
                <TextField
                  id="register-name"
                  value={name}
                  autoComplete="name"
                  placeholder="Jane Cooper"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => mark('name')}
                  error={touched.name && name.trim().length < 2}
                  helperText={touched.name && name.trim().length < 2 ? 'Please enter your name.' : ''}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className="auth-field">
                <label className="auth-field-label" htmlFor="register-email">Email</label>
                <TextField
                  id="register-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => mark('email')}
                  error={touched.email && email.length > 0 && !EMAIL_RE.test(email.trim())}
                  helperText={touched.email && email.length > 0 && !EMAIL_RE.test(email.trim()) ? 'That email does not look right.' : ''}
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
                <label className="auth-field-label" htmlFor="register-password">Password</label>
                <TextField
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => mark('password')}
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
              {password.length > 0 && (
                <div className="auth-strength" aria-live="polite">
                  <div className="auth-bars">
                    {[1, 2, 3, 4].map((bar) => (
                      <i
                        key={bar}
                        style={{ background: bar <= strength.score ? strength.color : undefined }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}

              <div className="auth-field">
                <label className="auth-field-label" htmlFor="register-confirm">Confirm password</label>
                <TextField
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => mark('confirm')}
                  error={touched.confirm && !passwordsMatch}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              {confirm.length > 0 && (
                <p className={password === confirm ? 'auth-match ok' : 'auth-match bad'}>
                  {password === confirm ? 'Passwords match.' : 'Passwords do not match yet.'}
                </p>
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
                    Creating your account…
                  </>
                ) : (
                  <>
                    <PersonAddAltOutlined fontSize="small" />
                    Create account
                  </>
                )}
              </button>
            </form>
          )}

          <p className="auth-fineprint">Authentic pieces · Secure checkout · Since 2026</p>
        </section>
      </div>
    </div>
  );
}

export default Register;
