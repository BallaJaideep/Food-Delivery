import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner, Pagination } from '../components/primitives';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Banknote,
  Phone,
  Power,
  RefreshCw,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Package,
  Store,
  Check,
  TrendingUp
} from 'lucide-react';

export const RiderDashboard = () => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.deliveryPartnerDetails?.isAvailable || false);
  const [vehicleType, setVehicleType] = useState(user?.deliveryPartnerDetails?.vehicleType || 'MOTORBIKE');
  const [deliveries, setDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination for Completed Ledger (Default: 5 per page)
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);

  // Fetch assigned deliveries
  const fetchRiderData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem('foodie_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [activeRes, completedRes, profileRes, analyticsRes] = await Promise.all([
        fetch('http://localhost:5000/api/operations/rider/deliveries?status=active', { headers }),
        fetch('http://localhost:5000/api/operations/rider/deliveries?status=completed', { headers }),
        fetch('http://localhost:5000/api/operations/rider/profile', { headers }),
        fetch('http://localhost:5000/api/operations/analytics/earnings', { headers })
      ]);

      const activeData = await activeRes.json();
      const completedData = await completedRes.json();
      const profileData = await profileRes.json();
      const analyticsResData = await analyticsRes.json();

      if (activeData.success && activeData.data?.deliveries) {
        setDeliveries(activeData.data.deliveries);
      }
      if (completedData.success && completedData.data?.deliveries) {
        setCompletedDeliveries(completedData.data.deliveries);
      }
      if (profileData.success && profileData.data?.profile?.deliveryPartnerDetails) {
        setIsAvailable(profileData.data.profile.deliveryPartnerDetails.isAvailable);
        setVehicleType(profileData.data.profile.deliveryPartnerDetails.vehicleType);
      }
      if (analyticsResData.success && analyticsResData.data) {
        setAnalyticsData(analyticsResData.data);
      }
    } catch (err) {
      console.error('Failed to sync rider deliveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
    const interval = setInterval(() => {
      fetchRiderData(true);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Toggle online availability
  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch('http://localhost:5000/api/operations/rider/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setIsAvailable(nextState);
        setToastMessage(`You are now ${nextState ? 'ONLINE & ready for orders' : 'OFFLINE'}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Mark Picked Up
  const handleMarkPickedUp = async (orderId) => {
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/operations/rider/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'PICKED_UP' })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Order picked up from kitchen! Proceed to customer doorstep.');
        setTimeout(() => setToastMessage(null), 3500);
        fetchRiderData(true);
      } else {
        alert(data.message || 'Error updating status');
      }
    } catch (err) {
      console.error('Pickup update error:', err);
      alert('Error updating to picked up.');
    }
  };

  // Step 1: Collect Cash, Step 2: Mark Delivered
  const handleCollectCashAndDeliver = async (orderId, totalAmount) => {
    const confirmCash = window.confirm(
      `Have you received physical cash of ₹${totalAmount} from the customer at their doorstep?`
    );
    if (!confirmCash) return;

    try {
      const token = localStorage.getItem('foodie_token');
      
      // 1. Collect COD
      const codRes = await fetch(`http://localhost:5000/api/orders/${orderId}/collect-cod`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const codData = await codRes.json();

      // 2. Mark Delivered
      const delivRes = await fetch(`http://localhost:5000/api/operations/rider/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'DELIVERED' })
      });
      const delivData = await delivRes.json();

      if (delivData.success || codData.success) {
        setToastMessage(`Cash of ₹${totalAmount} verified & delivery completed!`);
        setTimeout(() => setToastMessage(null), 3500);
        fetchRiderData(true);
      } else {
        alert(delivData.message || codData.message || 'Delivery completion error');
      }
    } catch (err) {
      console.error('Cash collection & delivery completion error:', err);
      alert('Network failure during doorstep completion.');
    }
  };

  // Financial calculation: Total cash currently in rider's pocket
  const cashInTransit = completedDeliveries
    .filter(d => d.codCollectionStatus === 'COLLECTED')
    .reduce((acc, d) => acc + (d.totalAmount || 0), 0);

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Rider Profile Card */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'var(--cod-green-bg)',
                color: 'var(--cod-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Truck size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Partner: {user?.name}
                  </h1>
                  <span className={`badge ${isAvailable ? 'badge-cod' : ''}`} style={{
                    backgroundColor: isAvailable ? 'var(--cod-green-bg)' : '#f1f5f9',
                    color: isAvailable ? 'var(--cod-green)' : 'var(--text-muted)'
                  }}>
                    {isAvailable ? 'ONLINE & READY' : 'OFFLINE'}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Vehicle: {vehicleType} • Strict Cash on Delivery Physical Handover
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleToggleAvailability}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: isAvailable ? '1.5px solid var(--danger-red)' : '1.5px solid var(--cod-green)',
                  backgroundColor: isAvailable ? 'rgba(239, 68, 68, 0.08)' : 'var(--cod-green-bg)',
                  color: isAvailable ? 'var(--danger-red)' : 'var(--cod-green)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Power size={16} />
                <span>{isAvailable ? 'Go Offline' : 'Go Online'}</span>
              </button>

              <button
                onClick={() => fetchRiderData(true)}
                disabled={refreshing}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--primary-teal)',
                  fontSize: '0.84rem',
                  fontWeight: 600
                }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
                <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div style={{
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--cod-green-bg)',
            border: '1px solid var(--cod-green-border)',
            padding: '14px 20px',
            color: '#065f46',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= RIDER EARNINGS & COD SETTLEMENT BREAKDOWN ================= */}
        <div className="card" style={{ padding: '26px', marginBottom: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary-teal)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Delivery Partner Earnings & Payout Ledger
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                You earn <strong>100% of delivery fees</strong> for all completed doorstep drop-offs. Disbursed once cash is handed over & reconciled in safe.
              </p>
            </div>

            {/* Timeframe Selector Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'today', label: 'Today (Day)' },
                { id: 'thisWeek', label: 'This Week' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'thisYear', label: 'This Year' },
                { id: 'allTime', label: 'All Time' }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: selectedTimeframe === tf.id ? '#ffffff' : 'transparent',
                    color: selectedTimeframe === tf.id ? 'var(--primary-teal)' : 'var(--text-secondary)',
                    boxShadow: selectedTimeframe === tf.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const period = analyticsData?.periods?.[selectedTimeframe] || {};
            const myPayout = period.myEarnings ?? period.riderPayout ?? 0;
            const reconciledCount = period.reconciledOrdersCount || 0;
            const totalOrders = period.totalOrders || 0;
            const pendingSafe = period.pendingReconciliation || 0;

            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* Reconciled Rider Payout */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                        🛵 Reconciled Rider Payout
                      </span>
                      <Truck size={16} color="#2563eb" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1d4ed8' }}>
                      ₹{myPayout.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#1e40af' }}>
                      Cleared & safe verified ({reconciledCount} deliveries)
                    </span>
                  </div>

                  {/* Cash in Hand (Unreconciled) */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                        Physical Cash in Pocket
                      </span>
                      <Banknote size={16} color="#d97706" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b45309' }}>
                      ₹{cashInTransit.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#92400e' }}>
                      Deposit to hub safe for admin audit
                    </span>
                  </div>

                  {/* Total Completed Runs */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                        Total Delivery Runs
                      </span>
                      <CheckCircle2 size={16} color="#16a34a" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#15803d' }}>
                      {totalOrders}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                      In selected {selectedTimeframe.replace('this', '').toLowerCase()} window
                    </span>
                  </div>

                  {/* Pending Total COD Safe Reconcile */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Awaiting Safe Verification
                      </span>
                      <Clock size={16} color="var(--deep-navy)" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                      ₹{pendingSafe.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Unreconciled order COD volume
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={15} color="var(--cod-green)" />
                  <span>
                    <strong>Strict COD Audit:</strong> To unlock rider payouts, hand over the physical cash notes collected from customers to the Hub Administrator. Once verified in the COD reconciliation report, your delivery partner payout is finalized.
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Quick Fleet Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-teal)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Assigned Deliveries
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--deep-navy)', marginTop: '4px' }}>
              {deliveries.length}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--cod-green)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Completed Today
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cod-green)', marginTop: '4px' }}>
              {completedDeliveries.length}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--surplus-amber)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Cash In Pocket (Unreconciled)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--surplus-amber)', marginTop: '4px' }}>
              ₹{cashInTransit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Deliveries Sub-Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('active')}
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            Active Deliveries ({deliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            Completed Ledger ({completedDeliveries.length})
          </button>
        </div>

        {/* ================= ACTIVE DELIVERIES ================= */}
        {activeTab === 'active' && (
          <div>
            {deliveries.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <Truck size={40} color="var(--primary-teal)" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                  No Active Deliveries Assigned
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {isAvailable
                    ? 'You are online. As kitchens dispatch cooked orders, they will show up here.'
                    : 'Toggle your status to ONLINE to receive incoming delivery dispatch alerts.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {deliveries.map((order) => {
                  const isReady = order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'ASSIGNED';
                  const isPickedUp = order.orderStatus === 'PICKED_UP';

                  return (
                    <div
                      key={order._id}
                      className="card"
                      style={{
                        padding: '24px',
                        borderLeft: isPickedUp ? '5px solid var(--cod-green)' : '5px solid var(--fresh-cyan)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                              #{order.orderNumber}
                            </span>
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: isPickedUp ? 'var(--cod-green-bg)' : 'var(--primary-teal-light)',
                              color: isPickedUp ? 'var(--cod-green)' : 'var(--primary-teal)'
                            }}>
                              {isPickedUp ? 'OUT FOR DELIVERY' : 'PICKUP AT KITCHEN'}
                            </span>
                            <span className="badge badge-cod">Collect COD: ₹{order.totalAmount}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Assigned Kitchen: <strong>{order.restaurant?.name}</strong>
                          </div>
                        </div>

                        {/* Action Triggers */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isReady && (
                            <button
                              onClick={() => handleMarkPickedUp(order._id)}
                              className="btn btn-primary"
                              style={{ padding: '9px 18px', fontSize: '0.86rem' }}
                            >
                              <Package size={15} /> Confirm Kitchen Pickup
                            </button>
                          )}

                          {isPickedUp && (
                            <button
                              onClick={() => handleCollectCashAndDeliver(order._id, order.totalAmount)}
                              className="btn btn-primary"
                              style={{
                                padding: '10px 20px',
                                fontSize: '0.88rem',
                                backgroundColor: 'var(--cod-green)',
                                borderColor: 'var(--cod-green)'
                              }}
                            >
                              <Banknote size={16} /> Collect ₹{order.totalAmount} & Complete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pickup & Destination Locations */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingTop: '16px' }}>
                        {/* Kitchen Pickup Info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Store size={15} color="var(--primary-teal)" />
                            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Step 1: Kitchen Pickup
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--deep-navy)', margin: '0 0 2px' }}>
                            {order.restaurant?.name}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                            {order.restaurant?.address?.street}, {order.restaurant?.address?.city}
                          </p>
                          {order.restaurant?.phone && (
                            <a href={`tel:${order.restaurant.phone}`} style={{ fontSize: '0.8rem', color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 600 }}>
                              Call Kitchen: {order.restaurant.phone}
                            </a>
                          )}
                        </div>

                        {/* Customer Doorstep Info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <MapPin size={15} color="var(--cod-green)" />
                            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Step 2: Customer Handover
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--deep-navy)', margin: '0 0 2px' }}>
                            {order.customer?.name}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                            {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </p>
                          {order.deliveryAddress?.phone && (
                            <a href={`tel:${order.deliveryAddress.phone}`} style={{ fontSize: '0.8rem', color: 'var(--cod-green)', textDecoration: 'none', fontWeight: 600 }}>
                              Call Customer: {order.deliveryAddress.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Cash Handover Instruction */}
                      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f0fdf4', border: '1px solid var(--cod-green-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#065f46' }}>
                          <ShieldCheck size={18} color="var(--cod-green)" />
                          <span>Customer must pay <strong>₹{order.totalAmount}</strong> in physical cash upon meal receipt.</span>
                        </div>
                        {order.notes && (
                          <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                            Note: {order.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= COMPLETED DELIVERIES ================= */}
        {activeTab === 'history' && (
          <div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '16px' }}>
                Delivered & Collected Cash Ledger
              </h3>
              {completedDeliveries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No deliveries completed yet.</p>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {completedDeliveries
                      .slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize)
                      .map(d => (
                        <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--deep-navy)', fontSize: '0.92rem' }}>
                              Order #{d.orderNumber} • {d.restaurant?.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Delivered to {d.customer?.name} ({d.deliveryAddress?.city})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--cod-green)', fontSize: '0.96rem' }}>
                              + ₹{d.totalAmount} (COD Collected)
                            </div>
                            <span style={{ fontSize: '0.72rem', color: d.codCollectionStatus === 'RECONCILED' ? 'var(--primary-teal)' : 'var(--surplus-amber)', fontWeight: 700 }}>
                              {d.codCollectionStatus === 'RECONCILED' ? 'Reconciled in Safe' : 'In Pocket Handover'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Rider Ledger Pagination */}
                  <Pagination
                    currentPage={historyPage}
                    totalItems={completedDeliveries.length}
                    pageSize={historyPageSize}
                    onPageChange={(p) => setHistoryPage(p)}
                    pageSizeOptions={[5, 10, 20]}
                    onPageSizeChange={(newSize) => {
                      setHistoryPageSize(newSize);
                      setHistoryPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
