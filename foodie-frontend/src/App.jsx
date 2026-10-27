import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { SignIn, Register, ForgotPassword, ResetPassword } from './pages/Auth';
import { CustomerDashboard, OwnerDashboard, RiderDashboard, AdminDashboard } from './pages/Dashboards';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import RestaurantDetail from './pages/RestaurantDetail';
import SurplusRescue from './pages/SurplusRescue';
import GroupOrder from './pages/GroupOrder';
import BudgetDiscovery from './pages/BudgetDiscovery';

/**
 * Returns the primary dashboard path for a given user role
 */
export const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer/dashboard';
    case 'RESTAURANT_OWNER':
      return '/dashboard/owner';
    case 'DELIVERY_PARTNER':
      return '/dashboard/rider';
    case 'ADMIN':
      return '/dashboard/admin';
    default:
      return '/customer/dashboard';
  }
};

/**
 * Protected Route Wrapper enforcing Authentication and RBAC
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>Verifying authenticated session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const roleDashboard = getRoleDashboardPath(user?.role);
    const roleNames = {
      CUSTOMER: 'Customer',
      RESTAURANT_OWNER: 'Kitchen Partner / Owner',
      DELIVERY_PARTNER: 'Delivery Rider',
      ADMIN: 'Platform Administrator'
    };

    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div className="card" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
          }} />

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 18px',
            boxShadow: '0 8px 18px rgba(239, 68, 68, 0.2)'
          }}>
            🛡️
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--deep-navy)', marginBottom: '8px' }}>
            Access Restricted
          </h3>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            Current Role: {roleNames[user?.role] || user?.role}
          </div>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '28px' }}>
            Your account role (<strong>{user?.role}</strong>) does not have permission to view this specific panel. You can proceed directly to your assigned workspace.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={roleDashboard}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '0.96rem',
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(13, 148, 136, 0.3)'
              }}
            >
              Go to Your {roleNames[user?.role] || 'Role'} Dashboard →
            </a>
            <a
              href="/"
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * Public Root Handler:
 * Visitors see the full marketing homepage.
 * Authenticated users are redirected to their respective role dashboard.
 */
const HomeRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>Loading Foodie...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return <Home />;
};

/**
 * Guest-Only Route:
 * If an already logged-in user visits /login or /register,
 * automatically redirect them to their role dashboard.
 */
const GuestOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Discovery / Landing Route (Visitors Only; Authenticated users route to role dashboard) */}
                <Route path="/" element={<HomeRoute />} />

                {/* Authentication Routes (Auto-redirect if already logged in) */}
                <Route
                  path="/login"
                  element={
                    <GuestOnlyRoute>
                      <SignIn />
                    </GuestOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestOnlyRoute>
                      <Register />
                    </GuestOnlyRoute>
                  }
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Public Restaurant Menu Discovery */}
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                <Route path="/surplus-rescue" element={<SurplusRescue />} />
                <Route path="/group-order" element={<GroupOrder />} />
                <Route path="/group-order/:code" element={<GroupOrder />} />
                <Route path="/budget-discovery" element={<BudgetDiscovery />} />

                {/* Cart, Strict COD Checkout & Live Order Tracking Routes */}
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-tracking/:id"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN']}>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />

                {/* Dedicated Customer Dashboard (Accessible to Customers, and also Kitchen Owners & Admins for ordering and preview) */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/customer"
                  element={<Navigate to="/customer/dashboard" replace />}
                />

                {/* Protected Role Dashboards */}
                <Route
                  path="/dashboard/owner"
                  element={
                    <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/rider"
                  element={
                    <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
                      <RiderDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
