import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, User, LogOut, Flame, HeartHandshake, Layers, ShieldCheck, Menu, X, UtensilsCrossed } from 'lucide-react';
import { StatusBadge } from './primitives';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="glass-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '14px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo & Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.45rem',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.32)',
            transition: 'transform var(--transition-fast)'
          }}>
            🍔
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.5px' }}>Foodie</span>
            <div style={{ display: 'inline-block', marginLeft: '10px' }}>
              <StatusBadge type="cod" label="COD Only" icon={false} />
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-nav-links">
          <Link to="/" style={{
            color: isActive('/') ? 'var(--primary-teal)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.94rem',
            position: 'relative',
            padding: '4px 0',
            transition: 'color var(--transition-fast)'
          }}>
            Home
            {isActive('/') && (
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                left: 0,
                width: '100%',
                height: '2px',
                backgroundColor: 'var(--primary-teal)',
                borderRadius: '2px'
              }} />
            )}
          </Link>

          <a href="#restaurants" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.94rem',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-teal)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <UtensilsCrossed size={16} color="var(--primary-teal)" /> Explore Kitchens
          </a>

          <Link to="/budget-discovery" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.94rem',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-teal)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <Flame size={17} color="var(--primary-teal)" /> Budget Meals
          </Link>

          <Link to="/surplus-rescue" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.94rem',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--surplus-amber)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <HeartHandshake size={17} color="var(--surplus-amber)" /> Surplus Rescue
          </Link>

          <Link to="/group-order" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.94rem',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fresh-cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <Layers size={17} color="var(--fresh-cyan)" /> Group Order
          </Link>
        </nav>

        {/* Action Controls: Cart & Top-Right Auth (Login & Sign Up) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Cart Trigger */}
          <Link to="/cart" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--border-subtle)',
            color: 'var(--deep-navy)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--primary-teal)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <ShoppingBag size={19} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--primary-teal)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.4)'
              }}>
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Profile / Auth Buttons (Login & Sign Up) */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to={user?.role === 'RESTAURANT_OWNER' ? '/dashboard/owner' : user?.role === 'DELIVERY_PARTNER' ? '/dashboard/rider' : user?.role === 'ADMIN' ? '/dashboard/admin' : '/customer/dashboard'}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-teal-light)',
                  color: 'var(--primary-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--deep-navy)', lineHeight: 1.2 }}>{user?.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--primary-teal)', fontWeight: 600 }}>{user?.role === 'CUSTOMER' ? 'Dashboard' : user?.role}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary" style={{
                padding: '8px 18px',
                fontSize: '0.88rem',
                border: '1px solid var(--border-medium)',
                boxShadow: 'none'
              }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{
                padding: '8px 20px',
                fontSize: '0.88rem'
              }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--deep-navy)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px'
            }}
            className="mobile-hamburger-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--deep-navy)', fontWeight: 600 }}>Home</Link>
          <a href="#restaurants" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--deep-navy)', fontWeight: 500 }}>Explore Kitchens</a>
          <Link to="/budget-discovery" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--deep-navy)', fontWeight: 500 }}>Budget Meals</Link>
          <Link to="/surplus-rescue" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--deep-navy)', fontWeight: 500 }}>Surplus Rescue</Link>
          <Link to="/group-order" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--deep-navy)', fontWeight: 500 }}>Group Order</Link>
        </div>
      )}

      {/* Inline styles for responsive visibility */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav-links {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
