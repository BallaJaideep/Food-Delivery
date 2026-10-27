import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Store,
  ChevronLeft,
  Flame,
  Check
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner } from '../components/primitives';

export const SurplusRescue = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservingId, setReservingId] = useState(null);
  const [reservationSuccess, setReservationSuccess] = useState(null);

  const fetchSurplusListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/operations/surplus');
      const data = await res.json();
      if (data.success && data.data?.listings) {
        setListings(data.data.listings);
      } else {
        setError(data.message || 'No surplus listings available.');
      }
    } catch (err) {
      console.error('Surplus fetch error:', err);
      setError('Failed to connect to surplus rescue network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurplusListings();
  }, []);

  // Customer reserves surplus meal
  const handleReserve = async (listingId, foodName, price) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/surplus-rescue');
      return;
    }

    setReservingId(listingId);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/operations/surplus/${listingId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: 1 })
      });
      const data = await res.json();

      if (data.success && data.data?.reservation) {
        setReservationSuccess({
          foodName,
          claimCode: data.data.reservation.claimCode,
          pickupDeadline: data.data.reservation.pickupDeadline,
          price
        });
        fetchSurplusListings();
      } else {
        alert(data.message || 'Reservation failed.');
      }
    } catch (err) {
      console.error('Reservation error:', err);
      alert('Error reserving surplus item.');
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--deep-navy)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Hero Banner */}
        <div className="card" style={{
          padding: '36px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1.5px solid var(--surplus-amber-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              color: 'var(--surplus-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)'
            }}>
              <HeartHandshake size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ backgroundColor: '#ffffff', color: 'var(--surplus-amber)', fontWeight: 800 }}>
                  ZERO FOOD WASTE INITIATIVE
                </span>
                <span className="badge badge-cod">Pay Cash at Pickup</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#92400e', margin: '4px 0 0', letterSpacing: '-0.5px' }}>
                Surplus Food Rescue Hub
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '0.96rem', color: '#78350f', maxWidth: '680px', lineHeight: 1.6, margin: 0 }}>
            Restaurants prepare incredible gourmet dishes daily. Before closing, unserved portions in peak freshness are made available here at up to <strong>70% discount</strong>. Reserve with zero prepayment and pay physical cash upon pickup.
          </p>
        </div>

        {/* Reservation Success Modal / Toast */}
        {reservationSuccess && (
          <div className="card" style={{
            padding: '24px',
            marginBottom: '28px',
            backgroundColor: '#ecfdf5',
            border: '2px solid var(--cod-green-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <CheckCircle2 size={26} color="var(--cod-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46', margin: '0 0 4px' }}>
                    Surplus Meal Successfully Reserved!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#047857', margin: '0 0 10px' }}>
                    Show this claim code to the kitchen staff and pay <strong>₹{reservationSuccess.price}</strong> in cash at the counter.
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    backgroundColor: '#ffffff',
                    border: '1.5px dashed var(--cod-green)',
                    borderRadius: '8px',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    color: '#065f46'
                  }}>
                    CLAIM CODE: {reservationSuccess.claimCode}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setReservationSuccess(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Dismiss ✕
              </button>
            </div>
          </div>
        )}

        {/* Listings Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
              Active Surplus Flash Deals ({listings.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Updated in real-time
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
              <CardSkeleton height="220px" />
              <CardSkeleton height="220px" />
              <CardSkeleton height="220px" />
            </div>
          ) : listings.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <Sparkles size={40} color="var(--surplus-amber)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                All Surplus Rescued!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Check back during afternoon lunch-break (2:30 PM - 4:00 PM) or after dinner rush (9:30 PM) when kitchens list fresh unserved packs.
              </p>
              <Link to="/customer/dashboard" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                Browse Full Menus
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {listings.map((item) => {
                const discountPct = Math.round(
                  ((item.surplusOriginalPrice - item.price) / item.surplusOriginalPrice) * 100
                );

                return (
                  <div
                    key={item._id}
                    className="card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1.5px solid var(--surplus-amber-border)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Kitchen badge & discount ribbon */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--surplus-amber-bg)',
                          color: '#b45309',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Store size={12} /> {item.restaurant?.name || 'Partner Kitchen'}
                        </span>

                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#ef4444',
                          color: '#ffffff'
                        }}>
                          {discountPct}% OFF
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 6px' }}>
                        {item.name}
                      </h3>

                      <p style={{
                        fontSize: '0.86rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 16px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.description || 'Fresh excess package from dinner rush, packaged securely for pickup.'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color="var(--surplus-amber)" />
                          Valid until {new Date(item.surplusAvailableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{item.surplusQuantityAvailable} left</span>
                      </div>
                    </div>

                    {/* Pricing & Claim Button */}
                    <div style={{ paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          ₹{item.surplusOriginalPrice}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                          ₹{item.price}
                        </div>
                      </div>

                      <button
                        onClick={() => handleReserve(item._id, item.name, item.price)}
                        disabled={reservingId === item._id || item.surplusQuantityAvailable < 1}
                        className="btn btn-primary"
                        style={{
                          padding: '9px 18px',
                          fontSize: '0.86rem',
                          backgroundColor: 'var(--surplus-amber)',
                          borderColor: 'var(--surplus-amber)'
                        }}
                      >
                        {reservingId === item._id ? 'Reserving...' : 'Reserve Meal'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default SurplusRescue;
