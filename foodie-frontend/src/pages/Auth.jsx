import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase,
  Truck,
  UtensilsCrossed,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

const AUTH_HD_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1600&q=85';

/**
 * Reusable Left Panel for Split-Screen Auth
 */
const AuthLeftHero = ({ title, subtitle, highlights = [] }) => (
  <div style={{
    position: 'relative',
    minHeight: '100%',
    padding: '60px 48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(13, 148, 136, 0.75) 50%, rgba(15, 23, 42, 0.90) 100%), url(${AUTH_HD_IMAGE})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#ffffff'
  }}>
    {/* Brand Header */}
    <div>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '40px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
        }}>
          🍔
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>Foodie</span>
      </Link>

      <div style={{ display: 'inline-block', marginBottom: '20px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.20)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          backdropFilter: 'blur(6px)'
        }}>
          <ShieldCheck size={15} /> 100% Cash on Delivery
        </span>
      </div>

      <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', color: '#ffffff', marginBottom: '16px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '1.05rem', color: '#e2e8f0', lineHeight: 1.6, maxWidth: '440px' }}>
        {subtitle}
      </p>
    </div>

    {/* Feature Highlights Flow */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: '40px 0' }}>
      {highlights.map((item, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          background: 'rgba(255, 255, 255, 0.10)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--primary-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <CheckCircle2 size={15} color="#ffffff" />
          </div>
          <div>
            <h5 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>{item.title}</h5>
            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Footer reassurance */}
    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '20px', fontSize: '0.82rem', color: '#94a3b8' }}>
      Safe, secure authentication. No credit card required at any step.
    </div>
  </div>
);

/**
 * Split-Screen Sign In Component
 */
export const SignIn = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.data) {
        login(data.data.token, data.data.user);
        const userRole = data.data.user?.role;
        if (userRole === 'RESTAURANT_OWNER') navigate('/dashboard/owner');
        else if (userRole === 'DELIVERY_PARTNER') navigate('/dashboard/rider');
        else if (userRole === 'ADMIN') navigate('/dashboard/admin');
        else navigate(redirectPath === '/' ? '/customer/dashboard' : redirectPath);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to backend server. Please verify backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
      {/* Left Panel */}
      <AuthLeftHero
        title="Savor Every Moment."
        subtitle="Sign in to track orders, explore your favorite kitchens, and enjoy seamless doorstep Cash on Delivery."
        highlights={[
          { title: 'Zero Payment Gateway Stress', desc: 'Inspect your hot meal first at your doorstep, then hand over exact cash.' },
          { title: 'Budget Meal Discoveries', desc: 'Access tailored meal sets according to your exact spending target.' },
          { title: 'Surplus Food Rescue', desc: 'Save delicious restaurant food from going to waste at up to 60% off.' }
        ]}
      />

      {/* Right Panel: Form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 32px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Back to Home Button */}
          <div style={{ marginBottom: '20px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.86rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--primary-teal)';
                e.currentTarget.style.borderColor = 'var(--primary-teal)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)' }}>
              Enter your credentials to access your Foodie account
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '24px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.84rem', color: 'var(--primary-teal)', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  required
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '15px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '14px',
                fontSize: '1rem',
                marginTop: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Switch to Register */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-teal)', fontWeight: 700, textDecoration: 'none' }}>
              Create an Account
            </Link>
          </div>

          {/* Development Quick-Fill Credentials Helper */}
          <div style={{
            marginTop: '28px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Quick Test Credentials
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => { setEmail('customer@foodie.local'); setPassword('Customer@123'); }}
                style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}
              >
                👤 <strong>Customer</strong>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('owner@foodie.local'); setPassword('Owner@123'); }}
                style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}
              >
                🍳 <strong>Kitchen Owner</strong>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('rider@foodie.local'); setPassword('Rider@123'); }}
                style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}
              >
                🛵 <strong>Delivery Partner</strong>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@foodie.local'); setPassword('Admin@123'); }}
                style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}
              >
                🛡️ <strong>Administrator</strong>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Split-Screen Register Component (Supporting Customer, Restaurant Owner, Delivery Partner)
 */
export const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Delivery Partner specific fields
  const [vehicleType, setVehicleType] = useState('BIKE');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      role: role.toUpperCase()
    };

    if (role === 'DELIVERY_PARTNER') {
      if (!vehicleNumber) {
        setError('Please provide your vehicle registration number.');
        return;
      }
      payload.deliveryPartnerDetails = {
        vehicleType,
        vehicleNumber: vehicleNumber.trim()
      };
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        login(data.data.token, data.data.user);
        if (role === 'RESTAURANT_OWNER') navigate('/dashboard/owner');
        else if (role === 'DELIVERY_PARTNER') navigate('/dashboard/rider');
        else if (role === 'ADMIN') navigate('/dashboard/admin');
        else navigate('/customer/dashboard');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to backend server. Please verify backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
      {/* Left Panel */}
      <AuthLeftHero
        title="Join the Foodie Community."
        subtitle="Create an account to experience true doorstep Cash on Delivery, manage your kitchen, or deliver smiles across your city."
        highlights={[
          { title: 'For Food Lovers', desc: 'Browse handcrafted cuisines, manage single-kitchen carts, and pay only when your food arrives.' },
          { title: 'For Kitchen Partners', desc: 'Showcase your restaurant, manage kitchen orders in real-time, and list surplus food to eliminate waste.' },
          { title: 'For Delivery Heroes', desc: 'Earn transparent income with doorstep cash collections and real-time route assignments.' }
        ]}
      />

      {/* Right Panel: Form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 32px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          {/* Back to Home Button */}
          <div style={{ marginBottom: '18px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.86rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--primary-teal)';
                e.currentTarget.style.borderColor = 'var(--primary-teal)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Create an Account
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Choose your role and register in under a minute
            </p>
          </div>

          {/* Role Selection Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                border: role === 'CUSTOMER' ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                backgroundColor: role === 'CUSTOMER' ? 'var(--primary-teal-light)' : '#ffffff',
                color: role === 'CUSTOMER' ? 'var(--primary-teal)' : 'var(--text-secondary)'
              }}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('RESTAURANT_OWNER')}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                border: role === 'RESTAURANT_OWNER' ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                backgroundColor: role === 'RESTAURANT_OWNER' ? 'var(--primary-teal-light)' : '#ffffff',
                color: role === 'RESTAURANT_OWNER' ? 'var(--primary-teal)' : 'var(--text-secondary)'
              }}
            >
              Kitchen Owner
            </button>
            <button
              type="button"
              onClick={() => setRole('DELIVERY_PARTNER')}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                border: role === 'DELIVERY_PARTNER' ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                backgroundColor: role === 'DELIVERY_PARTNER' ? 'var(--primary-teal-light)' : '#ffffff',
                color: role === 'DELIVERY_PARTNER' ? 'var(--primary-teal)' : 'var(--text-secondary)'
              }}
            >
              Delivery Rider
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                />
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            {/* Delivery Partner Specific Details */}
            {role === 'DELIVERY_PARTNER' && (
              <div style={{
                backgroundColor: 'var(--primary-teal-ultra-light)',
                border: '1px solid var(--primary-teal-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-teal)', textTransform: 'uppercase' }}>
                  Rider Fleet Details
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Vehicle</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="form-input"
                      style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                    >
                      <option value="BIKE">Motorcycle / Bike</option>
                      <option value="SCOOTER">Scooter</option>
                      <option value="EV">Electric Vehicle (EV)</option>
                      <option value="BICYCLE">Bicycle</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Plate Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-01-AB-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="form-input"
                      style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                Password (min 6 characters) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  required
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '15px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '14px',
                fontSize: '1rem',
                marginTop: '6px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating Account...' : `Register as ${role === 'CUSTOMER' ? 'Customer' : role === 'RESTAURANT_OWNER' ? 'Kitchen Owner' : 'Delivery Rider'}`}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Forgot Password Flow
 */
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        if (data.data?.devResetToken) {
          setDevToken(data.data.devResetToken);
        }
      } else {
        setError(data.message || 'Failed to dispatch reset instructions.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-app)' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-teal-light)',
            color: 'var(--primary-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.5px' }}>
            Reset Your Password
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Enter your email and we'll dispatch password reset instructions
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'var(--cod-green-bg)',
              border: '1.5px solid var(--cod-green-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              color: '#065f46',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              ✅ If that email address is registered on Foodie, a password reset link has been dispatched to your inbox.
            </div>

            {devToken && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'left',
                fontSize: '0.84rem',
                color: '#92400e',
                marginBottom: '24px'
              }}>
                <strong>Developer Test Token:</strong>
                <p style={{ marginTop: '4px', wordBreak: 'break-all' }}>{devToken}</p>
                <Link
                  to={`/reset-password/${devToken}`}
                  className="btn btn-secondary"
                  style={{ display: 'inline-block', marginTop: '10px', fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Click to Test Reset Link
                </Link>
              </div>
            )}

            <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                color: '#b91c1c',
                fontSize: '0.86rem'
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '13px', fontSize: '0.98rem' }}
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textDecoration: 'none' }}>
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * Reset Password Flow (from Token URL parameter)
 */
export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.message || 'Password reset token expired or invalid.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('Cannot connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-app)' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.5px' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Enter your new secure password below
          </p>
        </div>

        {success ? (
          <div style={{
            backgroundColor: 'var(--cod-green-bg)',
            border: '1.5px solid var(--cod-green-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'center',
            color: '#065f46',
            fontSize: '0.92rem'
          }}>
            🎉 Password updated successfully! Redirecting you to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                color: '#b91c1c',
                fontSize: '0.86rem'
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                New Password (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '13px', fontSize: '0.98rem' }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
