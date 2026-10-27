import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  Store,
  Truck,
  MapPin,
  Banknote,
  AlertCircle,
  Phone,
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  ShoppingBag,
  Info,
  Printer,
  Receipt
} from 'lucide-react';
import { StatusBadge, CardSkeleton, ErrorBanner } from '../components/primitives';
import InvoiceModal from '../components/InvoiceModal';

// Allowed progression steps in the Foodie Order State Machine
const LIFECYCLE_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & sent to kitchen' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Kitchen accepted the order' },
  { key: 'PREPARING', label: 'In Kitchen', desc: 'Chefs are cooking your meal' },
  { key: 'READY_FOR_PICKUP', label: 'Packed & Ready', desc: 'Awaiting rider pickup' },
  { key: 'PICKED_UP', label: 'Out for Delivery', desc: 'Rider is on the way to your door' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Physical cash collected at doorstep' }
];

export const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Check if just placed from checkout
  const justPlaced = location.state?.orderPlaced;

  const fetchOrderDetails = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success && data.data?.order) {
        setOrder(data.data.order);
      } else {
        setError(data.message || 'Unable to retrieve order details.');
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
      setError('Connection failure while tracking order.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    // Auto-poll order status every 7 seconds while active
    const pollInterval = setInterval(() => {
      fetchOrderDetails(true);
    }, 7000);

    return () => clearInterval(pollInterval);
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '50px 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card" style={{ padding: '40px' }}>
            <CardSkeleton height="35px" width="50%" style={{ marginBottom: '20px' }} />
            <CardSkeleton height="20px" width="80%" style={{ marginBottom: '30px' }} />
            <CardSkeleton height="140px" style={{ marginBottom: '20px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '50px 0' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 24px' }}>
            <AlertCircle size={44} color="var(--danger-red)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '8px' }}>
              Order Not Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px' }}>
              {error || 'We could not find an active order matching this ID.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => fetchOrderDetails()} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                Retry Status
              </button>
              <Link to="/customer/dashboard" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current stage index
  const currentStepIndex = LIFECYCLE_STEPS.findIndex(s => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED';
  const isDelivered = order.orderStatus === 'DELIVERED';

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Navigation Bar */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/customer/dashboard')}
              style={{
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--deep-navy)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <ChevronLeft size={16} /> My Dashboard
            </button>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
              Live Order Tracking
            </h1>
          </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="btn btn-secondary"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--deep-navy)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)'
                }}
              >
                <Printer size={15} color="var(--primary-teal)" />
                <span>Print COD Invoice</span>
              </button>

              <button
                onClick={() => fetchOrderDetails(true)}
                disabled={refreshing}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '6px 14px',
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
                <span>{refreshing ? 'Updating status...' : 'Refresh Status'}</span>
              </button>
            </div>
          </div>

        {/* Just Placed Celebration Notification */}
        {justPlaced && (
          <div style={{
            marginBottom: '24px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--cod-green-bg)',
            border: '1px solid var(--cod-green-border)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <CheckCircle2 size={24} color="var(--cod-green)" />
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#065f46', margin: '0 0 2px' }}>
                Order #{order.orderNumber} successfully placed!
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#047857', margin: 0 }}>
                The kitchen has been notified. Keep physical cash of ₹{order.totalAmount} ready for doorstep payment.
              </p>
            </div>
          </div>
        )}

        {/* Order Header Summary Card */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                  Order #{order.orderNumber}
                </span>
                <StatusBadge type="cod" label="Cash on Delivery" />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Kitchen: <strong>{order.restaurant?.name || 'Partner Kitchen'}</strong></span>
                <span>•</span>
                <span>Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Amount Due at Doorstep
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-teal)', lineHeight: 1.1 }}>
                ₹{order.totalAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--cod-green)', fontWeight: 700, marginTop: '2px' }}>
                {order.codCollectionStatus === 'COLLECTED' || order.codCollectionStatus === 'RECONCILED'
                  ? '✓ Cash Collected by Rider'
                  : 'Pending Doorstep Cash Payment'}
              </div>
            </div>
          </div>

          {/* Lifecycle Stepper */}
          <div style={{ paddingTop: '28px' }}>
            {isCancelled ? (
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-red-bg)',
                border: '1px solid var(--danger-red)',
                color: 'var(--danger-red)',
                textAlign: 'center'
              }}>
                <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px' }}>
                  Order Cancelled
                </h4>
                <p style={{ fontSize: '0.88rem', margin: 0 }}>
                  Reason: {order.cancellationReason || 'Order was cancelled by kitchen or user.'}
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  position: 'relative'
                }}>
                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const isStepCompleted = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={step.key}
                        style={{
                          textAlign: 'center',
                          padding: '12px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isCurrent ? 'var(--primary-teal-light)' : '#ffffff',
                          border: isCurrent ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                          transition: 'all var(--transition-normal)'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isStepCompleted ? 'var(--primary-teal)' : '#e2e8f0',
                          color: isStepCompleted ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {isStepCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                        </div>
                        <div style={{
                          fontSize: '0.84rem',
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? 'var(--primary-teal)' : isStepCompleted ? 'var(--deep-navy)' : 'var(--text-muted)',
                          marginBottom: '2px'
                        }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Detail Grid: Delivery Address & Order Contents */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* LEFT: Delivery Address & COD Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Address Box */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <MapPin size={20} color="var(--primary-teal)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Delivery Destination
                </h3>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--deep-navy)', fontWeight: 600, margin: '0 0 4px' }}>
                {order.deliveryAddress?.street}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                {order.deliveryAddress?.city}, {order.deliveryAddress?.postalCode || ''}
              </p>
              {order.deliveryAddress?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--deep-navy)' }}>
                  <Phone size={14} color="var(--primary-teal)" />
                  <span>Contact: {order.deliveryAddress.phone}</span>
                </div>
              )}
            </div>

            {/* Delivery Partner Details (if assigned) */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Truck size={20} color="var(--primary-teal)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Delivery Partner
                </h3>
              </div>

              {order.deliveryPartner ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--deep-navy)', margin: 0 }}>
                      {order.deliveryPartner.name}
                    </h4>
                    <span className="badge badge-cod">Assigned</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                    Vehicle: {order.deliveryPartner.deliveryPartnerDetails?.vehicleType || 'Motorcycle'}
                  </p>
                  {order.deliveryPartner.phone && (
                    <a
                      href={`tel:${order.deliveryPartner.phone}`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Phone size={14} /> Call Delivery Partner
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Our dispatch system is currently assigning the closest delivery partner to your kitchen.
                  </p>
                </div>
              )}
            </div>

            {/* Physical Cash Collection Warning */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <Banknote size={24} color="var(--cod-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 4px' }}>
                  Strict Cash On Delivery Verification
                </h4>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  The rider will inspect the food bag with you, receive the cash payment of <strong>₹{order.totalAmount}</strong>, and mark the order as COLLECTED in real-time on our platform.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: Items & Bill Details */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              Ordered Items ({order.items?.length || 0})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--deep-navy)', margin: '0 0 2px' }}>
                      {item.name}
                    </h5>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ₹{item.price} × {item.quantity}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.94rem', color: 'var(--deep-navy)' }}>
                    ₹{item.itemTotal || (item.price * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? <strong style={{ color: 'var(--cod-green)' }}>FREE</strong> : `₹${order.deliveryFee?.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Taxes & Packing</span>
                <span>₹{order.tax?.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--deep-navy)' }}>Total Cash Due</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                  ₹{order.totalAmount?.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setShowInvoiceModal(true)}
                className="btn btn-outline"
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Receipt size={16} color="var(--primary-teal)" />
                <span>Download / Print Official Receipt</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Official COD Tax Invoice & Delivery Receipt Modal */}
      <InvoiceModal
        order={order}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
export default OrderTracking;
