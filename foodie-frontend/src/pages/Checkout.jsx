import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Phone,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  Clock,
  ChevronLeft,
  Store,
  FileText,
  Calculator,
  Navigation
} from 'lucide-react';
import { StatusBadge, ErrorBanner } from '../components/primitives';
import { CITIES } from '../constants/cities';

export const Checkout = () => {
  const { cartItems, restaurant, subtotal, deliveryFee, platformFee, grandTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Address & Checkout Form States
  const [street, setStreet] = useState('');
  const restaurantCity = restaurant?.address?.city || 'Mumbai';
  const [city, setCity] = useState(restaurantCity);
  const [state, setState] = useState(restaurant?.address?.state || 'Maharashtra');
  const [postalCode, setPostalCode] = useState(restaurant?.address?.postalCode || '400001');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [cashDenominationNote, setCashDenominationNote] = useState('');
  const [agreedToCashPayment, setAgreedToCashPayment] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Strict City Matching Check
  const isDifferentCity = Boolean(
    restaurantCity &&
    city &&
    restaurantCity.trim().toLowerCase() !== city.trim().toLowerCase()
  );

  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${restaurant?.name || 'Restaurant'}, ${restaurantCity}`
  )}&destination=${encodeURIComponent(`${street ? street + ', ' : ''}${city}`)}`;

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setStreet(defaultAddr.street || '');
      setCity(defaultAddr.city || 'Metro City');
      setState(defaultAddr.state || 'Central State');
      setPostalCode(defaultAddr.postalCode || '400001');
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  // If cart is empty, redirect back to cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '580px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 24px' }}>
            <AlertCircle size={44} color="var(--primary-teal)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '8px' }}>
              No items to checkout
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px' }}>
              Your feast basket is currently empty. Please select food items before heading to checkout.
            </p>
            <Link to="/customer/dashboard" className="btn btn-primary" style={{ padding: '10px 22px' }}>
              Explore Menus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!street.trim() || !city.trim()) {
      setError('Please provide a complete street address and city for delivery.');
      return;
    }

    if (isDifferentCity) {
      setError(`Delivery not permitted: "${restaurant?.name}" only delivers to addresses within ${restaurantCity}. Please change your delivery city to ${restaurantCity} or select a restaurant located in ${city}.`);
      return;
    }

    if (!agreedToCashPayment) {
      setError('Please confirm that you will pay the exact total in physical cash upon delivery.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('foodie_token');
      
      const payload = {
        restaurant: restaurant._id,
        items: cartItems.map(item => ({
          foodItem: item._id,
          quantity: item.quantity
        })),
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          phone: phone.trim() || user?.phone || '9999999999'
        },
        paymentMethod: 'COD',
        notes: [
          deliveryNotes ? `Notes: ${deliveryNotes}` : '',
          cashDenominationNote ? `COD Note Tendered: ₹${cashDenominationNote}` : ''
        ].filter(Boolean).join(' | ') || undefined,
        idempotencyKey: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      };

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.data?.order) {
        clearCart();
        navigate(`/order-tracking/${data.data.order._id}`, {
          state: { orderPlaced: true, newOrderId: data.data.order._id }
        });
      } else {
        setError(data.message || 'Failed to place Cash on Delivery order.');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError('Network connection error. Please verify the backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/cart')}
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
            <ChevronLeft size={16} /> Return to Cart
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
            Strict Cash on Delivery (COD) Checkout
          </h1>
        </div>

        {error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorBanner message={error} />
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
            
            {/* ================= LEFT COLUMN: DELIVERY DETAILS & COD CONFIRMATION ================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Delivery Address Card */}
              <div className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-teal-light)',
                    color: 'var(--primary-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                      Doorstep Delivery Address
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Where our courier will deliver your food and collect physical cash
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                      Flat / House No. / Building / Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 402, Sunshine Towers, 12th Main Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Delivery City *
                      </label>
                      <select
                        value={city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setCity(newCity);
                          const cityInfo = CITIES.find(c => c.name.toLowerCase() === newCity.toLowerCase());
                          if (cityInfo) {
                            setState(cityInfo.state);
                            setPostalCode(`${cityInfo.postalPrefix}001`);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: isDifferentCity ? '2px solid #ef4444' : '1px solid var(--border-medium)',
                          backgroundColor: isDifferentCity ? '#fef2f2' : '#ffffff',
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--deep-navy)',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer'
                        }}
                      >
                        {CITIES.map(c => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.state})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 400001"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Out of City Delivery Warning & Map View */}
                  {isDifferentCity && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #f87171',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#991b1b' }}>
                            Delivery Not Available Outside {restaurantCity}
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#b91c1c', lineHeight: 1.45 }}>
                            "{restaurant?.name}" only delivers within <strong>{restaurantCity}</strong>. Your selected delivery city is <strong>{city}</strong>. Food items cannot cross city boundaries.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        <a
                          href={googleMapsRouteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#ffffff',
                            color: '#dc2626',
                            border: '1px solid #f87171',
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            textDecoration: 'none'
                          }}
                        >
                          <Navigation size={14} /> Open in Google Maps
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setCity(restaurantCity);
                            const cityInfo = CITIES.find(c => c.name.toLowerCase() === restaurantCity.toLowerCase());
                            if (cityInfo) {
                              setState(cityInfo.state);
                              setPostalCode(`${cityInfo.postalPrefix}001`);
                            }
                          }}
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Switch back to {restaurantCity}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                      Contact Phone for Doorstep Handover *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                      Delivery / Gate Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ring bell twice, leave with security guard if not answering"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Strict Cash on Delivery Details Card */}
              <div className="card" style={{ padding: '28px', border: '1.5px solid var(--cod-green-border)', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--cod-green-bg)',
                    color: 'var(--cod-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Banknote size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                      Payment Method: Cash on Delivery
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--cod-green)', fontWeight: 700, margin: 0 }}>
                      Zero Prepayment Required • Safe & Contact-verified
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
                  Our platform operates strictly on a physical Cash on Delivery model. No cards, net-banking, or wallets are required online. Pay only when the delivery partner arrives with your warm meal.
                </p>

                {/* Optional Note Denomination notification for Rider */}
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Note Denomination You Will Pay With (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${Math.ceil(grandTotal / 100) * 100 || 500}`}
                    value={cashDenominationNote}
                    onChange={(e) => setCashDenominationNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Helps the delivery rider bring exact change in coins or smaller bills.
                  </span>
                </div>

                {/* Agreement Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    required
                    checked={agreedToCashPayment}
                    onChange={(e) => setAgreedToCashPayment(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-teal)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.86rem', color: 'var(--deep-navy)', lineHeight: 1.4 }}>
                    I confirm that I will inspect my meal package and pay the final amount of <strong>₹{grandTotal.toFixed(2)}</strong> in physical cash to the delivery partner upon arrival.
                  </span>
                </label>
              </div>

            </div>

            {/* ================= RIGHT COLUMN: ORDER SUMMARY & PLACEMENT ================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Order Review Box */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Ordering From</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '2px 0 0' }}>
                      {restaurant?.name}
                    </h3>
                  </div>
                  <span className="badge badge-cod">COD Enabled</span>
                </div>

                {/* Item Line List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {cartItems.map((item) => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--primary-teal)', fontSize: '0.85rem' }}>
                          {item.quantity}×
                        </span>
                        <span style={{ color: 'var(--deep-navy)', fontWeight: 500 }}>
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--deep-navy)' }}>
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--cod-green)' }}>FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Taxes & Packing</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--deep-navy)' }}>Final COD Amount</span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--cod-green)', fontWeight: 700 }}>Due Upon Doorstep Delivery</div>
                    </div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !agreedToCashPayment}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)',
                  cursor: loading || !agreedToCashPayment ? 'not-allowed' : 'pointer',
                  opacity: loading || !agreedToCashPayment ? 0.75 : 1
                }}
              >
                {loading ? (
                  <span>Transmitting Order to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm & Place COD Order</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <ShieldCheck size={16} color="var(--cod-green)" />
                  <span>Verified cash receipts given by delivery partner</span>
                </div>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};
export default Checkout;
