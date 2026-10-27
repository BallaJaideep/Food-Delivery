import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner, Pagination } from '../components/primitives';
import {
  ShieldAlert,
  Users,
  Store,
  Truck,
  Banknote,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Search,
  Check,
  TrendingUp,
  Percent,
  Calendar,
  PieChart,
  Wallet
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('financials'); // 'financials' | 'users'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reconcilingId, setReconcilingId] = useState(null);
  const [auditReport, setAuditReport] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today'); // 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'allTime'
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination for COD Audit Table (Default: 10 per page)
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem('foodie_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [overviewRes, reportRes, usersRes, analyticsRes] = await Promise.all([
        fetch('http://localhost:5000/api/operations/admin/overview', { headers }),
        fetch('http://localhost:5000/api/orders/cod/reconciliation-report', { headers }),
        fetch(`http://localhost:5000/api/operations/admin/users?role=${userRoleFilter}&search=${userSearch}`, { headers }),
        fetch('http://localhost:5000/api/operations/analytics/earnings', { headers })
      ]);

      const overviewData = await overviewRes.json();
      const reportData = await reportRes.json();
      const usersData = await usersRes.json();
      const analyticsResData = await analyticsRes.json();

      if (overviewData.success && overviewData.data) {
        setOverview(overviewData.data);
      }
      if (reportData.success && reportData.data) {
        setAuditReport(reportData.data);
      }
      if (usersData.success && usersData.data?.users) {
        setUsersList(usersData.data.users);
      }
      if (analyticsResData.success && analyticsResData.data) {
        setAnalyticsData(analyticsResData.data);
      }
    } catch (err) {
      console.error('Error fetching admin oversight data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [userRoleFilter, userSearch]);

  // Admin reconciles cash handover from rider into platform safe
  const handleReconcileOrder = async (orderId) => {
    setReconcilingId(orderId);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/reconcile-cod`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes: 'Physical cash received from rider and deposited into safe.' })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Order cash verified and locked in platform safe!`);
        setTimeout(() => setToastMessage(null), 3000);
        fetchAdminData(true);
      } else {
        alert(data.message || 'Reconciliation failed.');
      }
    } catch (err) {
      console.error('Error reconciling cash:', err);
      alert('Error reconciling order cash.');
    } finally {
      setReconcilingId(null);
    }
  };

  // Admin toggles user account status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/operations/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('User account status updated.');
        setTimeout(() => setToastMessage(null), 2500);
        fetchAdminData(true);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1160px' }}>
        
        {/* Admin Header */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Platform Administration: {user?.name}
                  </h1>
                  <span className="badge badge-cod">Strict COD Ledger Active</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Physical Cash On Delivery Reconciliation, Rider Audits, & Account Moderation
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchAdminData(true)}
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
              <span>{refreshing ? 'Refreshing...' : 'Audit Refresh'}</span>
            </button>
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

        {/* 4 Financial Ledger Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="card" style={{ padding: '22px', borderLeft: '4px solid var(--cod-green)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Reconciled in Safe
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cod-green)', marginTop: '4px' }}>
              ₹{overview?.financialSummary?.codReconciled?.toFixed(2) || '0.00'}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Verified cash bank deposits</span>
          </div>

          <div className="card" style={{ padding: '22px', borderLeft: '4px solid var(--fresh-cyan)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Cash with Riders (Collected)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--fresh-cyan)', marginTop: '4px' }}>
              ₹{overview?.financialSummary?.codCollectedByRiders?.toFixed(2) || '0.00'}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Awaiting safe reconciliation</span>
          </div>

          <div className="card" style={{ padding: '22px', borderLeft: '4px solid var(--surplus-amber)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Doorstep Cash Pending
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--surplus-amber)', marginTop: '4px' }}>
              ₹{overview?.financialSummary?.codPendingCollection?.toFixed(2) || '0.00'}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Active cooking & transit</span>
          </div>

          <div className="card" style={{ padding: '22px', borderLeft: '4px solid var(--primary-teal)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total COD Order Volume
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-teal)', marginTop: '4px' }}>
              ₹{overview?.financialSummary?.grossPlatformOrderValue?.toFixed(2) || '0.00'}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Platform gross order value</span>
          </div>
        </div>

        {/* ================= MODERN MULTI-TIMEFRAME EARNINGS & SPLIT ================= */}
        <div className="card" style={{ padding: '26px', marginBottom: '28px', backgroundColor: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary-teal)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Reconciled Revenue & Payouts Breakdown
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Stakeholder disbursements unlocked once Administrator marks order as <strong>RECONCILED</strong>.
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

          {/* 3 Pillars of Earning + Gross Collected */}
          {(() => {
            const period = analyticsData?.periods?.[selectedTimeframe] || {};
            const gross = period.reconciledGross || 0;
            const restPayout = period.restaurantPayout || 0;
            const adminComm = period.adminCommission || 0;
            const riderPayout = period.riderPayout || 0;

            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Pillar 1: Restaurant Owners Earnings (85%) */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                        🍳 Restaurant Owners (85%)
                      </span>
                      <Store size={16} color="#16a34a" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#15803d' }}>
                      ₹{restPayout.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#166534' }}>Disbursed post safe reconciliation</span>
                  </div>

                  {/* Pillar 2: Platform Administrator Profit / Margin (15% + Fees) */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: 'var(--primary-teal-light)', border: '1px solid rgba(13, 148, 136, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary-teal)', textTransform: 'uppercase' }}>
                        🛡 Platform Admin Margin
                      </span>
                      <Percent size={16} color="var(--primary-teal)" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                      ₹{adminComm.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Net platform operating margin</span>
                  </div>

                  {/* Pillar 3: Delivery Partners Payout (Delivery Fees) */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                        🛵 Delivery Partners Payout
                      </span>
                      <Truck size={16} color="#2563eb" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1d4ed8' }}>
                      ₹{riderPayout.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#1e40af' }}>100% delivery fees cleared</span>
                  </div>

                  {/* Pillar 4: Total Reconciled in Period */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                        💵 Total Reconciled COD
                      </span>
                      <Banknote size={16} color="#9333ea" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7e22ce' }}>
                      ₹{gross.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#6b21a8' }}>{period.reconciledOrdersCount || 0} orders reconciled</span>
                  </div>
                </div>

                {/* Ratio Visual Progress Bar */}
                {gross > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>Kitchens: {Math.round((restPayout / gross) * 100)}%</span>
                      <span>Admin: {Math.round((adminComm / gross) * 100)}%</span>
                      <span>Riders: {Math.round((riderPayout / gross) * 100)}%</span>
                    </div>
                    <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${(restPayout / gross) * 100}%`, backgroundColor: '#16a34a' }} title="Restaurant Cut" />
                      <div style={{ width: `${(adminComm / gross) * 100}%`, backgroundColor: 'var(--primary-teal)' }} title="Admin Cut" />
                      <div style={{ width: `${(riderPayout / gross) * 100}%`, backgroundColor: '#2563eb' }} title="Rider Cut" />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('financials')}
            className={`btn ${activeTab === 'financials' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            <Banknote size={16} /> Cash Reconciliation Ledger
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            <Users size={16} /> User Directory & RBAC Moderation
          </button>
        </div>

        {/* ================= TAB 1: FINANCIAL LEDGER & CASH HANDOVER ================= */}
        {activeTab === 'financials' && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Doorstep COD Audit Table
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Verify that physical cash received by delivery riders has been deposited into the company safe.
                </p>
              </div>
            </div>

            {auditReport?.orders?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No orders in reconciliation log.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Order #</th>
                      <th style={{ padding: '10px 12px' }}>Kitchen</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Rider</th>
                      <th style={{ padding: '10px 12px' }}>COD Total</th>
                      <th style={{ padding: '10px 12px' }}>Kitchen (85%)</th>
                      <th style={{ padding: '10px 12px' }}>Admin Margin</th>
                      <th style={{ padding: '10px 12px' }}>Rider Cut</th>
                      <th style={{ padding: '10px 12px' }}>COD Status</th>
                      <th style={{ padding: '10px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(auditReport?.orders || [])
                      .slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize)
                      .map((ord) => {
                        const isCollected = ord.codCollectionStatus === 'COLLECTED';
                        const isReconciled = ord.codCollectionStatus === 'RECONCILED';

                        // Compute split values
                        const itemSub = ord.subtotal || Math.max(0, ord.totalAmount - (ord.deliveryFee || 0) - (ord.tax || 0));
                        const restShare = ord.restaurantPayout || (Math.round(itemSub * 0.85 * 100) / 100);
                        const riderShare = ord.riderPayout || (ord.deliveryFee > 0 ? ord.deliveryFee : 40);
                        const adminShare = ord.adminCommission || (Math.round((ord.totalAmount - restShare - riderShare) * 100) / 100);

                        return (
                          <tr key={ord._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: 'var(--deep-navy)' }}>
                              #{ord.orderNumber}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--deep-navy)' }}>
                              {ord.restaurant?.name || 'Kitchen'}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                              {ord.customer?.name}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                              {ord.deliveryPartner?.name || 'Unassigned'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 800, color: 'var(--deep-navy)' }}>
                              ₹{ord.totalAmount}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: isReconciled ? '#15803d' : 'var(--text-muted)' }}>
                              ₹{restShare}
                              {!isReconciled && <span style={{ display: 'block', fontSize: '0.68rem', color: '#b45309' }}>Locks on Safe Dep.</span>}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: isReconciled ? 'var(--primary-teal)' : 'var(--text-muted)' }}>
                              ₹{adminShare}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: isReconciled ? '#1d4ed8' : 'var(--text-muted)' }}>
                              ₹{riderShare}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: isReconciled
                                  ? 'var(--cod-green-bg)'
                                  : isCollected
                                  ? 'rgba(6, 182, 212, 0.12)'
                                  : '#fef2f2',
                                color: isReconciled
                                  ? 'var(--cod-green)'
                                  : isCollected
                                  ? 'var(--fresh-cyan)'
                                  : 'var(--danger-red)'
                              }}>
                                {ord.codCollectionStatus}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              {isCollected && (
                                <button
                                  onClick={() => handleReconcileOrder(ord._id)}
                                  disabled={reconcilingId === ord._id}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                >
                                  {reconcilingId === ord._id ? 'Reconciling...' : 'Reconcile Safe Deposit'}
                                </button>
                              )}
                              {isReconciled && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--cod-green)', fontWeight: 700 }}>
                                  ✓ Safe Reconciled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* Audit Table Pagination */}
                <Pagination
                  currentPage={auditPage}
                  totalItems={auditReport?.orders?.length || 0}
                  pageSize={auditPageSize}
                  onPageChange={(p) => setAuditPage(p)}
                  pageSizeOptions={[10, 20, 50]}
                  onPageSizeChange={(newSize) => {
                    setAuditPageSize(newSize);
                    setAuditPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: USER DIRECTORY & RBAC ================= */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: '24px' }}>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              >
                <option value="">All Platform Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="RESTAURANT_OWNER">Restaurant Owners</option>
                <option value="DELIVERY_PARTNER">Delivery Partners</option>
                <option value="ADMIN">Administrators</option>
              </select>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Name</th>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Role</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--deep-navy)' }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          color: 'var(--deep-navy)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: u.isActive ? '#16a34a' : '#ef4444'
                        }}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            borderRadius: '4px',
                            border: u.isActive ? '1px solid #ef4444' : '1px solid #16a34a',
                            backgroundColor: '#ffffff',
                            color: u.isActive ? '#ef4444' : '#16a34a',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
