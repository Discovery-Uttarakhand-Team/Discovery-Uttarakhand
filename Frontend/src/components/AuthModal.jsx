import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Account type options ───────────────────────────────────────────────── */

const ACCOUNT_TYPES = [
  {
    value: 'user',
    icon: '👤',
    label: 'Traveler / User',
    description: 'Explore, plan and book Uttarakhand trips.',
  },
  {
    value: 'partner',
    icon: '🏢',
    label: 'Partner / Business',
    description: 'List and manage your tourism business.',
  },
];

const PARTNER_TYPES = [
  { value: 'Homestay',         label: '🏡 Hotel / Homestay' },
  { value: 'Guide',            label: '🧭 Local Guide' },
  { value: 'VehicleRental',    label: '🛵 Bike / Scooty / Car Rental' },
  { value: 'TrekOperator',     label: '⛰️  Trek Operator' },
  { value: 'ActivityProvider', label: '🎯 Activity / Experience' },
];

/* ─── Custom "Login as / Register as" dropdown ───────────────────────────── */

const AccountTypeDropdown = ({ value, onChange, accentColor, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ACCOUNT_TYPES.find((t) => t.value === value);

  // Close on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); }
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</div>
      <div ref={ref} style={{ position: 'relative' }}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            border: `1.5px solid ${open ? accentColor : '#d1d5db'}`,
            borderRadius: 10,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#1c1917',
            boxShadow: open ? `0 0 0 2.5px ${accentColor}22` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            outline: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17 }}>{selected?.icon}</span>
            {selected?.label}
          </span>
          <span
            style={{
              fontSize: 10,
              color: '#6b7280',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </button>

        {/* Dropdown list */}
        {open && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 300,
              background: '#fff',
              border: '1.5px solid #e5e7eb',
              borderRadius: 12,
              boxShadow: '0 10px 32px rgba(0,0,0,0.13)',
              padding: 6,
              margin: 0,
              listStyle: 'none',
            }}
          >
            {ACCOUNT_TYPES.map((t) => {
              const isSelected = value === t.value;
              return (
                <li
                  key={t.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onChange(t.value); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? `${accentColor}12` : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${accentColor}14`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? `${accentColor}12` : 'transparent'; }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1.35, flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1917' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{t.description}</div>
                  </div>
                  {isSelected && (
                    <span style={{ color: accentColor, fontSize: 14, flexShrink: 0, paddingTop: 3 }}>✓</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ─── Reusable input field ───────────────────────────────────────────────── */

const Field = ({ label, name, type = 'text', value, onChange, placeholder, required, accentColor }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        htmlFor={`auth-field-${name}`}
        style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}
      >
        {label}
      </label>
      <input
        id={`auth-field-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: `1.5px solid ${focused ? accentColor : '#d1d5db'}`,
          boxShadow: focused ? `0 0 0 2.5px ${accentColor}22` : 'none',
          outline: 'none',
          fontSize: 14,
          color: '#1c1917',
          background: '#fff',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
};

/* ─── Main AuthModal ─────────────────────────────────────────────────────── */

const AuthModal = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const {
    authModalOpen,
    setAuthModalOpen,
    login,
    register,
    registerPartnerAccount,
    authError,
    setAuthError,
    authMode,          // 'user' | 'partner' preset by openPartnerAuth
    getPostLoginPath,
  } = useAuth();

  const [isLogin, setIsLogin]           = useState(true);
  const [accountType, setAccountType]   = useState('user'); // 'user' | 'partner'
  const [loading, setLoading]           = useState(false);
  const [validationError, setValidation] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', businessName: '', partnerType: '',
  });

  /* Sync authMode from context (e.g. navbar "Partner Login" clicked) */
  useEffect(() => {
    if (authModalOpen) {
      setAccountType(authMode === 'partner' ? 'partner' : 'user');
      setIsLogin(true);
      setValidation('');
      setAuthError(null);
      setForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', businessName: '', partnerType: '' });
    }
  }, [authModalOpen, authMode, setAuthError]);

  if (!authModalOpen) return null;

  /* Derived */
  const isPartner   = accountType === 'partner';
  const accentColor = isPartner ? '#7c5c2e' : '#1a4331';
  const accentLight = isPartner ? '#fdf6ee' : '#f0faf5';

  /* Handlers */
  const close = () => setAuthModalOpen(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setValidation('');
  };

  const handleTypeChange = (v) => {
    setAccountType(v);
    setValidation('');
    setAuthError(null);
  };

  const toggleMode = () => {
    setIsLogin((p) => !p);
    setValidation('');
    setAuthError(null);
  };

  const validate = () => {
    if (!form.email.trim() || !form.password) {
      setValidation('Please fill in all required fields.'); return false;
    }
    if (!isLogin) {
      if (!form.name.trim())            { setValidation('Please enter your full name.'); return false; }
      if (form.password.length < 6)     { setValidation('Password must be at least 6 characters.'); return false; }
      if (form.password !== form.confirmPassword) { setValidation('Passwords do not match.'); return false; }
      if (isPartner && !form.partnerType) { setValidation('Please select your business type.'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await login({ email: form.email, password: form.password });
      } else if (isPartner) {
        result = await registerPartnerAccount({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone, businessName: form.businessName || form.name,
          partnerType: form.partnerType,
        });
      } else {
        result = await register({ name: form.name, email: form.email, password: form.password });
      }

      if (result?.success) {
        // Use ACTUAL backend role for redirect — never trust dropdown value
        const role = result.user?.role;
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'partner') {
          navigate('/partner', { replace: true });
        } else {
          // Restore safe return URL (only internal paths, never /partner or /admin for non-partners)
          const from = location.state?.from?.pathname;
          const safePath =
            from &&
            from.startsWith('/') &&
            !from.startsWith('/partner') &&
            !from.startsWith('/admin') &&
            !from.startsWith('http')
              ? from
              : '/';
          navigate(safePath, { replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const errorMsg = validationError || authError;

  const heading = isLogin
    ? (isPartner ? 'Partner Business Login'   : 'Welcome Back')
    : (isPartner ? 'Create Partner Account'   : 'Create Your Account');

  const subtext = isLogin
    ? (isPartner ? 'Login to manage your tourism business.'      : 'Login to plan and explore Uttarakhand.')
    : (isPartner ? 'Register your business on Discovery Uttarakhand.' : 'Join and start exploring Uttarakhand.');

  /* ── JSX ── */
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-heading"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(3px)',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 430,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 20,
          padding: '32px 26px 26px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          borderTop: `4px solid ${accentColor}`,
          transition: 'border-color 0.25s',
        }}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none',
            fontSize: 18, cursor: 'pointer',
            color: '#9ca3af', lineHeight: 1, padding: '4px 6px', borderRadius: 6,
          }}
        >
          ✕
        </button>

        {/* Logo mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: accentLight, border: `1.5px solid ${accentColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.25s, border-color 0.25s',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={accentColor}>
              <path d="M12 2L8 8C8 8 5 9 5 13C5 17 8 20 12 22C16 20 19 17 19 13C19 9 16 8 16 8L12 2Z" />
              <path d="M12 22V10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2
          id="auth-heading"
          style={{
            textAlign: 'center', margin: '0 0 4px',
            fontSize: 21, fontWeight: 800, color: accentColor,
            fontFamily: 'system-ui, sans-serif', transition: 'color 0.25s',
          }}
        >
          {heading}
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
          {subtext}
        </p>

        {/* Error */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2', color: '#dc2626',
            border: '1px solid #fecaca', borderRadius: 10,
            padding: '9px 14px', fontSize: 13,
            marginBottom: 14, textAlign: 'center',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Role dropdown ── */}
          <AccountTypeDropdown
            value={accountType}
            onChange={handleTypeChange}
            accentColor={accentColor}
            label={isLogin ? 'Login as' : 'Register as'}
          />

          {/* Name (register only) */}
          {!isLogin && (
            <Field label="Full Name *" name="name" value={form.name} onChange={handleChange}
              placeholder="Your full name" required accentColor={accentColor} />
          )}

          {/* Email */}
          <Field label="Email Address *" name="email" type="email" value={form.email}
            onChange={handleChange} placeholder="you@example.com" required accentColor={accentColor} />

          {/* Password */}
          <Field label="Password *" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="Min. 6 characters" required accentColor={accentColor} />

          {/* Confirm password (register only) */}
          {!isLogin && (
            <Field label="Confirm Password *" name="confirmPassword" type="password"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Repeat password" required accentColor={accentColor} />
          )}

          {/* Partner-only fields (register only) */}
          {!isLogin && isPartner && (
            <>
              {/* Subtle divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0',
              }}>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 700, letterSpacing: 0.8 }}>
                  BUSINESS INFO
                </span>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              </div>

              <Field label="Phone Number" name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="+91 XXXXX XXXXX" accentColor={accentColor} />

              <Field label="Business Name" name="businessName" value={form.businessName}
                onChange={handleChange} placeholder="Your hotel, rental or service name" accentColor={accentColor} />

              {/* Business type select */}
              <div>
                <label
                  htmlFor="auth-field-partnerType"
                  style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}
                >
                  Business Type *
                </label>
                <select
                  id="auth-field-partnerType"
                  name="partnerType"
                  value={form.partnerType}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${form.partnerType ? accentColor : '#d1d5db'}`,
                    outline: 'none', fontSize: 14,
                    color: form.partnerType ? '#1c1917' : '#9ca3af',
                    background: '#fff', boxSizing: 'border-box', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Select business type...</option>
                  {PARTNER_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0', marginTop: 2,
              background: loading ? '#9ca3af' : accentColor,
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.2, fontFamily: 'inherit',
              transition: 'opacity 0.15s, background 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading
              ? '⏳ Please wait...'
              : isLogin
                ? (isPartner ? 'Sign In to Partner Portal' : 'Sign In')
                : (isPartner ? 'Create Partner Account' : 'Create Account')}
          </button>
        </form>

        {/* Toggle login / register */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none', border: 'none', fontWeight: 700,
              cursor: 'pointer', color: accentColor,
              textDecoration: 'underline', fontSize: 13, padding: 0,
            }}
          >
            {isLogin
              ? (isPartner ? 'Register as Partner' : 'Register here')
              : 'Sign in'}
          </button>
        </p>

        {/* Partner registration note */}
        {isPartner && !isLogin && (
          <div style={{
            marginTop: 12,
            background: '#fdf6ee', border: '1px solid #d4a85c33',
            borderRadius: 10, padding: '9px 14px',
            fontSize: 12, color: '#7c5c2e', lineHeight: 1.55,
            textAlign: 'center',
          }}>
            ℹ️ After registration you can complete your business profile, add listings, and submit for admin verification.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
