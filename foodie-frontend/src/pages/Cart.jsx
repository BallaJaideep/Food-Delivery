import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Calculator,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Store,
  ChevronLeft
} from 'lucide-react';
import { StatusBadge } from '../components/primitives';

export const Cart = () => {
  const { cartItems, restaurant, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, platformFee, grandTotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Cash change calculator states
  const [cashTendered, setCashTendered] = useState('');
  const [quickAmountSelected, setQuickAmountSelected] = useState(null);

  // Common Indian currency notes
  const COMMON_CURRENCY_NOTES = [100, 200, 500, 2000];

  const numericCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericCashTendered - grandTotal);
  const isExactChange = numericCashTendered === grandTotal && grandTotal > 0;
  const isShortage = numericCashTendered > 0 && numericCashTendered < grandTotal;

  const handleQuickNote = (note) => {
    // If user clicks a note, calculate closest total >= grandTotal with that note or set it directly
    const computed = note >= grandTotal ? note : Math.ceil(grandTotal / note) * note;
    setCashTendered(computed.toString());
    setQuickAmountSelected(note);
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '60px 32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-teal-ultra-light)',
              color: 'var(--primary-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)'
            }}>
              <ShoppingBag size={40} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '10px' }}>
              Your Feast Basket is Empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '420px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Explore nearby kitchens, pick gourmet favorites, or grab discounted surplus meals before they run out!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/customer/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.92rem' }}>
                Explore Kitchens
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '0.92rem' }}>
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate(-1)}
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
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
              Your Food Cart
            </h1>
          </div>

          <button
            onClick={clearCart}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--danger-red)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={16} /> Clear Cart
          </button>
        </div>

        {/* Main Grid: Cart Items (Left) + Order Summary & Doorstep Cash Calculator (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: KITCHEN & ITEMS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Restaurant Badge Card */}
            {restaurant && (
              <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-teal-light)',
                    color: 'var(--primary-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Store size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Selected Kitchen
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '2px 0 0' }}>
                      {restaurant.name}
                    </h3>
                  </div>
                </div>

                <StatusBadge type="cod" label="COD Only Kitchen" />
              </div>
            )}

            {/* Cart Items List */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Order Items ({cartItems.length})
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Freshly Prepared
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px dashed var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, paddingRight: '12px' }}>
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: item.isVegetarian ? '1.5px solid #16a34a' : '1.5px solid #dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: item.isVegetarian ? '#16a34a' : '#dc2626'
                        }} />
                      </span>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid var(--border-subtle)'
                          }}
                        />
                      )}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--deep-navy)', margin: '0 0 2px' }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          ₹{item.price} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector & Item Total */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '8px',
                        padding: '4px 8px'
                      }}>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--deep-navy)',
                            padding: '2px'
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--primary-teal)',
                            padding: '2px'
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div style={{ minWidth: '65px', textAlign: 'right', fontWeight: 800, fontSize: '0.96rem', color: 'var(--deep-navy)' }}>
                        ₹{item.price * item.quantity}
                      </div>

                      <button
                        onClick={() => removeItem(item._id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '4px'
                        }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strict Cash on Delivery Assurance Banner */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '1px solid var(--cod-green-border)',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: 'var(--cod-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
              }}>
                <Banknote size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46', margin: '0 0 3px' }}>
                  100% Cash on Delivery Guaranteed
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                  No digital cards or prepayments required. Pay our delivery partner with physical cash only after inspecting your tamper-proof food package at your doorstep.
                </p>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: SUMMARY & CHANGE CALCULATOR ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Order Bill Breakdown Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '18px' }}>
                Bill Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Item Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>₹{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Standard Delivery Fee</span>
                    {subtotal >= 500 && (
                      <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--primary-teal-light)', color: 'var(--primary-teal)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        FREE OVER ₹500
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>
                    {deliveryFee === 0 ? <span style={{ color: 'var(--cod-green)' }}>FREE</span> : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes & Restaurant Packaging</span>
                  <span style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>₹{platformFee.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)' }}>To Pay at Doorstep</span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--cod-green)', fontWeight: 600 }}>Physical Cash (COD)</div>
                  </div>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Doorstep Cash & Change Calculator */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Calculator size={20} color="var(--primary-teal)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Doorstep Change Estimator
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Have a large note? Enter your bill denomination to see the exact cash return our rider should prepare for you.
              </p>

              {/* Quick Note Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {COMMON_CURRENCY_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => handleQuickNote(note)}
                    style={{
                      border: quickAmountSelected === note ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                      backgroundColor: quickAmountSelected === note ? 'var(--primary-teal-light)' : '#ffffff',
                      color: quickAmountSelected === note ? 'var(--primary-teal)' : 'var(--deep-navy)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    ₹{note} note
                  </button>
                ))}
              </div>

              {/* Custom Cash Tendered Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                  Cash You Will Hand Over (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder={`e.g. ${Math.ceil(grandTotal / 100) * 100}`}
                    value={cashTendered}
                    onChange={(e) => {
                      setCashTendered(e.target.value);
                      setQuickAmountSelected(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: isShortage ? '1.5px solid var(--danger-red)' : '1px solid var(--border-medium)',
                      fontSize: '0.94rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Change Output Badge */}
              {numericCashTendered > 0 && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isShortage ? 'var(--danger-red-bg)' : isExactChange ? 'var(--primary-teal-light)' : 'var(--cod-green-bg)',
                  border: `1px solid ${isShortage ? 'var(--danger-red)' : isExactChange ? 'var(--primary-teal)' : 'var(--cod-green-border)'}`,
                  fontSize: '0.86rem'
                }}>
                  {isShortage ? (
                    <div style={{ color: 'var(--danger-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      <span>Amount entered is ₹{(grandTotal - numericCashTendered).toFixed(2)} less than total bill.</span>
                    </div>
                  ) : isExactChange ? (
                    <div style={{ color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} />
                      <span>Exact amount! No change needed at doorstep.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#065f46' }}>
                      <span style={{ fontWeight: 600 }}>Rider will return change:</span>
                      <strong style={{ fontSize: '1.05rem', color: '#047857' }}>₹{changeDue.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '15px 24px',
                fontSize: '1.02rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.28)'
              }}
            >
              <span>Proceed to COD Checkout</span>
              <ArrowRight size={18} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Safe delivery • Physical Cash Handover • Tamper-proof packaging
            </p>

          </div>

        </div>

      </div>
    </div>
  );
};
export default Cart;
