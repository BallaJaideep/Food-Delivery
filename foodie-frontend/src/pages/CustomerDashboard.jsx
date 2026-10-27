import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Search,
  MapPin,
  ShoppingBag,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  HeartHandshake,
  Package,
  Layers,
  ArrowRight,
  Plus,
  Check,
  AlertCircle,
  Percent,
  SlidersHorizontal,
  ChevronLeft,
  Printer,
  Receipt
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner, Pagination } from '../components/primitives';
import InvoiceModal from '../components/InvoiceModal';
import { CITIES } from '../constants/cities';

// Swiggy-style Food Categories with refined visual icons & labels
const CATEGORY_CHIPS = [
  { name: 'Biryani', icon: '🍚', query: 'Biryani' },
  { name: 'Pizza', icon: '🍕', query: 'Pizza' },
  { name: 'Burgers', icon: '🍔', query: 'Burger' },
  { name: 'South Indian', icon: '🥘', query: 'South Indian' },
  { name: 'Chinese', icon: '🥢', query: 'Chinese' },
  { name: 'Dim Sum', icon: '🥟', query: 'Dim Sum' },
  { name: 'Desserts', icon: '🍰', query: 'Dessert' },
  { name: 'Healthy Meals', icon: '🥗', query: 'Salad' }
];

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { addItem, cartItems, restaurant: cartRestaurant } = useCart();
  const navigate = useNavigate();

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Pagination for Past Orders & Delivery History (Default: 5 per page)
  const [pastOrdersPage, setPastOrdersPage] = useState(1);
  const [pastOrdersPageSize, setPastOrdersPageSize] = useState(5);

  // Selected Delivery City for Customer
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  // Enforce role dashboard redirect only for delivery partners
  useEffect(() => {
    if (user?.role === 'DELIVERY_PARTNER') {
      navigate('/dashboard/rider', { replace: true });
    }
  }, [user, navigate]);

  // Data states
  const [restaurants, setRestaurants] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [surplusListings, setSurplusListings] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeBudget, setActiveBudget] = useState(null);
  const [customBudget, setCustomBudget] = useState('');
  const [addedItemNotification, setAddedItemNotification] = useState(null);

  // Time-based personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch real backend data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('foodie_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const cityParam = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : '';
      const [restRes, foodRes, surplusRes, ordersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/restaurants?limit=30${cityParam}`),
        fetch('http://localhost:5000/api/food?limit=30'),
        fetch('http://localhost:5000/api/operations/surplus'),
        token ? fetch('http://localhost:5000/api/orders/my', { headers }) : Promise.resolve({ json: () => ({ success: false }) })
      ]);

      const restData = await restRes.json();
      const foodData = await foodRes.json();
      const surplusData = await surplusRes.json();
      const ordersData = await ordersRes.json();

      if (restData.success) {
        setRestaurants(restData.data.restaurants || []);
      }
      if (foodData.success) {
        setPopularItems(foodData.data.items || []);
      }
      if (surplusData.success) {
        setSurplusListings(surplusData.data.listings || []);
      }
      if (ordersData.success) {
        const allOrders = ordersData.data.orders || [];
        const nonTerminal = allOrders.filter(
          o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)
        );
        const terminal = allOrders.filter(
          o => ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)
        );
        setActiveOrders(nonTerminal);
        setPastOrders(terminal);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load live menu and restaurant feed. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCity]);

  // Filter restaurants based on search & category
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.cuisine && r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = !activeCategory ||
      (r.cuisine && r.cuisine.some(c => c.toLowerCase().includes(activeCategory.toLowerCase())));

    return matchesSearch && matchesCategory;
  });

  // Filter popular food items by search and budget
  const filteredFoodItems = popularItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const effectiveBudget = activeBudget || (customBudget ? Number(customBudget) : null);
    const matchesBudget = !effectiveBudget || item.price <= effectiveBudget;

    const matchesCategory = !activeCategory ||
      (item.category && item.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
      item.name.toLowerCase().includes(activeCategory.toLowerCase());

    return matchesSearch && matchesBudget && matchesCategory;
  });

  // Handle Add-to-Cart with single-restaurant notification feedback
  const handleAddToCart = (foodItem) => {
    // foodItem.restaurant may be an object or populated id
    const restInfo = typeof foodItem.restaurant === 'object' && foodItem.restaurant !== null
      ? foodItem.restaurant
      : restaurants.find(r => r._id === foodItem.restaurant) || {
          _id: foodItem.restaurant,
          name: 'Partner Kitchen'
        };

    const success = addItem(foodItem, restInfo);
    if (success) {
      setAddedItemNotification(`Added "${foodItem.name}" to your cart!`);
      setTimeout(() => setAddedItemNotification(null), 3500);
    }
  };

  const handleBudgetSelect = (amount) => {
    if (activeBudget === amount) {
      setActiveBudget(null);
    } else {
      setActiveBudget(amount);
      setCustomBudget('');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', paddingBottom: '70px' }}>
      {/* =========================================================================
          NOTIFICATION TOAST
          ========================================================================= */}
      {addedItemNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          backgroundColor: 'var(--deep-navy)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeInUp 0.3s ease'
        }}>
          <Check size={18} color="var(--primary-teal)" />
          <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{addedItemNotification}</span>
          <Link to="/cart" style={{
            color: 'var(--fresh-cyan)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.86rem',
            marginLeft: '8px'
          }}>
            View Cart →
          </Link>
        </div>
      )}

      {/* =========================================================================
          A. DASHBOARD SUBHEADER (Personal Greeting & Compact Location Pill)
          ========================================================================= */}
      <section style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '18px 0'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--deep-navy)',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Foodie'}!
                </h1>
                <span className="badge badge-cod" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                  COD Enabled
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={15} color="var(--primary-teal)" />
                  <span>Delivering to:</span>
                </span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--primary-teal)',
                    backgroundColor: 'var(--primary-teal-light)',
                    color: 'var(--primary-teal)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {CITIES.map(c => (
                    <option key={c.name} value={c.name}>
                      📍 {c.name} ({c.state})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  (Showing kitchens within {selectedCity})
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/cart" className="btn btn-secondary" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              fontSize: '0.88rem'
            }}>
              <ShoppingBag size={17} color="var(--primary-teal)" />
              <span>Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          I. ACTIVE ORDERS HERO SECTION (If user has running orders)
          ========================================================================= */}
      {activeOrders.length > 0 && (
        <section style={{ padding: '24px 0 0' }}>
          <div className="container">
            <div className="card" style={{
              padding: '20px 24px',
              borderLeft: '4px solid var(--primary-teal)',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-teal-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-teal)'
                  }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', margin: 0 }}>
                      Live Order in Progress
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Track your kitchen preparation and doorstep Cash collection
                    </span>
                  </div>
                </div>
                <span className="badge badge-cod">Cash On Delivery</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeOrders.map(order => (
                  <div key={order._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-teal-ultra-light)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--deep-navy)', fontSize: '0.94rem' }}>
                        {order.restaurant?.name || 'Partner Kitchen'} • <span style={{ color: 'var(--primary-teal)' }}>{order.orderNumber}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Status: <strong style={{ color: 'var(--deep-navy)' }}>{order.orderStatus}</strong> • Doorstep Cash: <strong>₹{order.totalAmount}</strong> ({order.codCollectionStatus})
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--primary-teal)'
                      }}>
                        {order.orderStatus}
                      </span>
                      <Link
                        to={`/order-tracking/${order._id}`}
                        className="btn btn-primary"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <Clock size={13} />
                        <span>Track Live Order →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          B. SEARCH AND DISCOVERY (What would you like to eat today?)
          ========================================================================= */}
      <section style={{ padding: '28px 0 16px' }}>
        <div className="container">
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--deep-navy)',
              marginBottom: '16px',
              letterSpacing: '-0.4px'
            }}>
              What would you like to eat today?
            </h2>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '2px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 18px',
              transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
            }}>
              <Search size={22} color="var(--primary-teal)" style={{ marginRight: '14px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search restaurants, dishes (Biryani, Burger, Dim Sum), or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.98rem',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--deep-navy)',
                  padding: '8px 0'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '4px 8px'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Cuisine Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Suggested:</span>
              {['Pan-Asian', 'Chinese', 'Street Food', 'Dim Sum'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag === searchQuery ? '' : tag)}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    background: searchQuery === tag ? 'var(--primary-teal-light)' : '#ffffff',
                    color: searchQuery === tag ? 'var(--primary-teal)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          C. FOOD CATEGORIES (Horizontal Swiggy-Style Circular Avatars)
          ========================================================================= */}
      <section style={{ padding: '16px 0 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
              Inspiration for your order
            </h3>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-teal)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Reset Filter
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '18px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            msOverflowStyle: 'none'
          }}>
            {CATEGORY_CHIPS.map(cat => {
              const isSelected = activeCategory === cat.query;
              return (
                <div
                  key={cat.name}
                  onClick={() => setActiveCategory(isSelected ? null : cat.query)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minWidth: '84px',
                    flexShrink: 0,
                    transition: 'transform var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--primary-teal)' : '#ffffff',
                    border: `2px solid ${isSelected ? 'var(--primary-teal)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: isSelected ? '0 6px 16px rgba(13, 148, 136, 0.3)' : 'var(--shadow-xs)',
                    transition: 'all var(--transition-fast)'
                  }}>
                    {cat.icon}
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? 'var(--primary-teal)' : 'var(--deep-navy)',
                    marginTop: '8px',
                    textAlign: 'center'
                  }}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          D. PROMOTIONAL DISCOVERY BANNERS (Compact Swiggy Carousels)
          ========================================================================= */}
      <section style={{ padding: '8px 0 24px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '18px'
          }}>
            {/* Banner 1: Budget Deals */}
            <div style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#99f6e4'
                }}>
                  Smart Spending
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 8px', lineHeight: 1.25 }}>
                  Meals Within Your Budget
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#ccfbf1', maxWidth: '300px', lineHeight: 1.45 }}>
                  Chef specials and wholesome meals under ₹200.
                </p>
              </div>
              <button
                onClick={() => handleBudgetSelect(200)}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '16px',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary-teal)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Filter under ₹200</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Banner 2: Surplus Rescue */}
            <div style={{
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#fef3c7'
                }}>
                  Zero Waste Food
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 8px', lineHeight: 1.25 }}>
                  Surplus Food Rescue Offers
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#fef3c7', maxWidth: '300px', lineHeight: 1.45 }}>
                  Fresh surplus portions rescued directly from top local kitchens.
                </p>
              </div>
              <a
                href="#surplus-rescue"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '16px',
                  backgroundColor: '#ffffff',
                  color: '#b45309',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Explore Rescue Meals</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Banner 3: Cash on Delivery */}
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#a7f3d0'
                }}>
                  Payment Convenience
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 8px', lineHeight: 1.25 }}>
                  Doorstep Cash on Delivery
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#d1fae5', maxWidth: '300px', lineHeight: 1.45 }}>
                  Inspect your warm parcel first. Pay exact physical cash to rider.
                </p>
              </div>
              <div style={{
                alignSelf: 'flex-start',
                marginTop: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '7px 16px',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                100% Guaranteed COD
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          E. RECOMMENDED RESTAURANTS (Restaurants you might love)
          ========================================================================= */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                Restaurants you might love
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Handcrafted menus from verified neighborhood kitchens
              </p>
            </div>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {filteredRestaurants.length} Kitchen{filteredRestaurants.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <EmptyState
                title="No matching restaurants found"
                description={`We couldn't find any kitchens matching "${searchQuery || activeCategory}". Try searching for another cuisine.`}
              />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '22px'
            }}>
              {filteredRestaurants.map(restaurant => (
                <Link
                  key={restaurant._id}
                  to={`/restaurant/${restaurant._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="card" style={{
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ position: 'relative', height: '190px', overflow: 'hidden' }}>
                      <img
                        src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                        alt={restaurant.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform var(--transition-smooth)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                      />
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span className="badge badge-cod">Cash on Delivery</span>
                      </div>
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: restaurant.isOpen ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {restaurant.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                          {restaurant.name}
                        </h3>
                        {restaurant.rating > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            <Star size={12} fill="#059669" color="#059669" />
                            <span>{restaurant.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {restaurant.cuisine.slice(0, 3).map(c => (
                            <span key={c} style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-secondary)',
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 500
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      <p style={{
                        fontSize: '0.86rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                        lineHeight: 1.5
                      }}>
                        {restaurant.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          <MapPin size={14} />
                          <span>{restaurant.address?.city || 'Metro Hub'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-teal)', fontSize: '0.86rem', fontWeight: 700 }}>
                          <span>View Menu</span>
                          <ChevronRight size={15} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          F. POPULAR FOOD ITEMS (Quick Add-to-Cart with Cart-Rule Enforcement)
          ========================================================================= */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                Popular Food Items
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Trending dishes prepared fresh upon your order
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : filteredFoodItems.length === 0 ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <EmptyState
                title="No dishes found"
                description="Try adjusting your budget or category filters to discover dishes."
              />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {filteredFoodItems.map(item => {
                const restName = item.restaurant?.name || 'Partner Kitchen';
                return (
                  <div key={item._id} className="card" style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          border: `1.5px solid ${item.isVegetarian ? '#16a34a' : '#dc2626'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffffff'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: item.isVegetarian ? '#16a34a' : '#dc2626'
                          }} />
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--deep-navy)',
                          margin: '0 0 4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          From: <strong>{restName}</strong>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                          ₹{item.price}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {item.category || 'Specialty'}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn btn-primary"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          G. BUDGET-FRIENDLY DISCOVERY (Interactive Budget Selector)
          ========================================================================= */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Flame size={20} color="var(--primary-teal)" />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Delicious meals within your budget
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Set your maximum price to discover complete dishes across partner kitchens
                </p>
              </div>

              {/* Budget Quick-Select Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {[100, 150, 200, 300].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleBudgetSelect(amt)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${activeBudget === amt ? 'var(--primary-teal)' : 'var(--border-medium)'}`,
                      backgroundColor: activeBudget === amt ? 'var(--primary-teal)' : '#ffffff',
                      color: activeBudget === amt ? '#ffffff' : 'var(--deep-navy)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Under ₹{amt}
                  </button>
                ))}
                {activeBudget && (
                  <button
                    onClick={() => setActiveBudget(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear budget
                  </button>
                )}
              </div>
            </div>

            {/* Filtered Budget Meal Results preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px'
            }}>
              {popularItems
                .filter(it => (activeBudget ? it.price <= activeBudget : it.price <= 200))
                .slice(0, 4)
                .map(item => (
                  <div key={item._id} style={{
                    backgroundColor: '#ffffff',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-navy)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.restaurant?.name || 'Partner Kitchen'}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-teal)', marginTop: '4px' }}>
                        ₹{item.price}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-sm)',
                        borderColor: 'var(--primary-teal)',
                        color: 'var(--primary-teal)'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          H. SURPLUS FOOD RESCUE (Amber Accent Banner & Active Listings)
          ========================================================================= */}
      <section id="surplus-rescue" style={{ padding: '24px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid var(--surplus-amber-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <HeartHandshake size={22} color="var(--surplus-amber)" />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#78350f', margin: 0 }}>
                    Good food deserves a second chance.
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#92400e' }}>
                  Help neighborhood restaurants eliminate food waste. Freshly prepared surplus dishes at subsidized prices.
                </p>
              </div>
              <span className="badge badge-surplus" style={{ fontWeight: 700 }}>
                Zero Food Waste Initiative
              </span>
            </div>

            {surplusListings.length === 0 ? (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                border: '1px dashed var(--surplus-amber-border)'
              }}>
                <p style={{ fontSize: '0.92rem', color: '#92400e', fontWeight: 600, margin: 0 }}>
                  No active surplus dishes right now.
                </p>
                <p style={{ fontSize: '0.82rem', color: '#b45309', margin: '4px 0 0' }}>
                  Kitchens publish excess fresh meals closer to closing hours. Check back later in the evening!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {surplusListings.map(item => (
                  <div key={item._id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid var(--surplus-amber-border)',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--deep-navy)', margin: 0 }}>
                          {item.name}
                        </h4>
                        <span style={{
                          backgroundColor: 'var(--surplus-amber-bg)',
                          color: '#b45309',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {item.discountPercent || 'Surplus Offer'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        From {item.restaurant?.name || 'Local Kitchen'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                          ₹{item.price}
                        </span>
                        {item.surplusOriginalPrice && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{item.surplusOriginalPrice}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '6px', fontWeight: 600 }}>
                        ⏳ {item.minutesRemaining || 'Limited time remaining'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      style={{
                        marginTop: '14px',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} />
                      <span>Rescue Meal (₹{item.price})</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          J. GROUP ORDERING DISCOVERY CARD
          ========================================================================= */}
      <section style={{ padding: '16px 0 24px' }}>
        <div className="container">
          <div className="card" style={{
            padding: '24px 28px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-teal)',
                flexShrink: 0
              }}>
                <Layers size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 4px' }}>
                  Ordering for an office team or family?
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '520px' }}>
                  Create a shareable group code so everyone selects their own meal from the same kitchen. Single COD checkout handled at doorstep.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/group-order" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
                Start Group Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          J. PAST ORDERS HISTORY (Customer previous feasts & reorder trigger)
          ========================================================================= */}
      <section style={{ padding: '16px 0 28px' }}>
        <div className="container">
          <div className="card" style={{ padding: '28px 30px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-teal-light)',
                  color: 'var(--primary-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Past Orders & Delivery History
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    View past orders, delivered meals, and doorstep Cash receipts
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {pastOrders.length} Completed {pastOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {pastOrders.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '4px' }}>
                  No Completed Orders Yet
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Once your food is delivered and cash is collected at your doorstep, your order receipt will appear here.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {pastOrders
                    .slice((pastOrdersPage - 1) * pastOrdersPageSize, pastOrdersPage * pastOrdersPageSize)
                    .map(order => {
                      const isDelivered = order.orderStatus === 'DELIVERED';
                      const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED';

                      return (
                        <div
                          key={order._id}
                          style={{
                            padding: '18px 20px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px'
                          }}
                        >
                          <div style={{ flex: '1 1 320px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                                {order.restaurant?.name || 'Partner Kitchen'}
                              </span>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: isDelivered ? 'var(--cod-green-bg)' : 'var(--danger-red-bg)',
                                color: isDelivered ? 'var(--cod-green)' : 'var(--danger-red)'
                              }}>
                                {isDelivered ? '✓ DELIVERED' : order.orderStatus}
                              </span>
                              <span className="badge badge-cod" style={{ fontSize: '0.7rem' }}>
                                COD Paid
                              </span>
                            </div>

                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            <div style={{ fontSize: '0.85rem', color: 'var(--deep-navy)', fontWeight: 500 }}>
                              {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                                Total Paid (COD)
                              </span>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                                ₹{order.totalAmount?.toFixed(2)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="btn btn-outline"
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '0.82rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                title="Print official COD invoice"
                              >
                                <Printer size={14} color="var(--primary-teal)" />
                                <span>Invoice</span>
                              </button>

                              <Link
                                to={`/order-tracking/${order._id}`}
                                className="btn btn-secondary"
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '0.82rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>Live Status →</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={pastOrdersPage}
                  totalItems={pastOrders.length}
                  pageSize={pastOrdersPageSize}
                  onPageChange={(page) => setPastOrdersPage(page)}
                  pageSizeOptions={[5, 10, 20]}
                  onPageSizeChange={(newSize) => {
                    setPastOrdersPageSize(newSize);
                    setPastOrdersPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Official COD Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* =========================================================================
          K. COMPACT CUSTOMER FOOTER (Non-marketing, focused on account & support)
          ========================================================================= */}
      <footer style={{
        marginTop: '40px',
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 0',
        color: 'var(--text-secondary)',
        fontSize: '0.82rem'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong>Foodie Customer Dashboard</strong> • 100% Cash on Delivery
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <Link to="/cart" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Your Cart</Link>
            <a href="#surplus-rescue" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Surplus Rescue</a>
            <span style={{ color: 'var(--text-muted)' }}>Help & Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
