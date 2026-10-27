import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  HeartHandshake,
  ShieldCheck,
  Clock,
  Star,
  MapPin,
  Search,
  ChevronRight,
  UtensilsCrossed,
  Compass,
  Wallet,
  CheckCircle2,
  Truck,
  Leaf,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner } from '../components/primitives';
import { CITIES } from '../constants/cities';

const CUISINE_SHORTCUTS = ['All', 'Biryani', 'Mughlai', 'Italian', 'Pizza', 'Pan-Asian', 'Burgers', 'South Indian', 'Continental', 'Desserts'];

// High-resolution gourmet food image for hero
const HD_HERO_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=85';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [surplusListings, setSurplusListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const cityParam = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : '';
      const [restRes, surplusRes] = await Promise.all([
        fetch(`http://localhost:5000/api/restaurants?limit=50${cityParam}`),
        fetch('http://localhost:5000/api/operations/surplus')
      ]);

      const restData = await restRes.json();
      const surplusData = await surplusRes.json();

      if (restData.success) {
        setRestaurants(restData.data.restaurants || []);
      } else {
        setError(restData.message || 'Failed to retrieve restaurants.');
      }

      if (surplusData.success) {
        setSurplusListings(surplusData.data.listings || []);
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
      setError('Cannot connect to the Foodie backend server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.cuisine && r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCuisine = selectedCuisine === 'All' ||
      (r.cuisine && r.cuisine.some(c => c.toLowerCase() === selectedCuisine.toLowerCase()));
    return matchesSearch && matchesCuisine;
  });

  return (
    <div style={{ paddingBottom: '0' }}>
      {/* =========================================================================
          1. LARGE HD FOOD HERO SECTION
          ========================================================================= */}
      <section style={{
        position: 'relative',
        minHeight: '620px',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.65) 50%, rgba(15, 23, 42, 0.88) 100%), url(${HD_HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff',
        padding: '80px 0 90px'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '880px' }}>
          {/* Subtle Cash on Delivery Badge */}
          <div className="animate-fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.20)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)'
            }}>
              <ShieldCheck size={16} /> Cash on Delivery Available
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="animate-fade-in-up delay-100" style={{
            fontSize: '3.6rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '0 4px 18px rgba(0, 0, 0, 0.45)'
          }}>
            Good Food. Great Moments. <br />
            <span style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Delivered.
            </span>
          </h1>

          {/* Hero Supporting Text */}
          <p className="animate-fade-in-up delay-200" style={{
            fontSize: '1.18rem',
            color: '#e2e8f0',
            marginBottom: '36px',
            maxWidth: '680px',
            margin: '0 auto 36px',
            fontWeight: 400,
            lineHeight: 1.6
          }}>
            Discover exceptional restaurants, explore meals that fit your budget, and enjoy convenient doorstep delivery with Cash on Delivery.
          </p>

          {/* Two Call-to-Action Buttons */}
          <div className="animate-fade-in-up delay-300" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '44px'
          }}>
            <a href="#restaurants" className="btn btn-primary" style={{
              padding: '14px 30px',
              fontSize: '1.02rem',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.45)'
            }}>
              <UtensilsCrossed size={19} /> Explore Restaurants
            </a>
            <Link to="/budget-discovery" className="btn btn-secondary" style={{
              padding: '14px 28px',
              fontSize: '1.02rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderColor: 'transparent',
              color: 'var(--deep-navy)'
            }}>
              <Flame size={19} color="var(--primary-teal)" /> Discover Budget Meals
            </Link>
          </div>

          {/* Integrated City Selector & Search Bar */}
          <div className="animate-fade-in-up delay-400" style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: 'var(--radius-xl)',
            padding: '6px 14px',
            maxWidth: '720px',
            margin: '0 auto',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(10px)',
            gap: '10px'
          }}>
            {/* City Dropdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRight: '1px solid var(--border-medium)',
              paddingRight: '12px',
              flexShrink: 0
            }}>
              <MapPin size={20} color="var(--primary-teal)" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--deep-navy)',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  fontFamily: 'var(--font-family)',
                  cursor: 'pointer'
                }}
              >
                {CITIES.map(c => (
                  <option key={c.name} value={c.name}>
                    📍 {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dish / Cuisine Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={`Search dishes or restaurants in ${selectedCity}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--deep-navy)',
                  fontSize: '0.98rem',
                  fontFamily: 'var(--font-family)',
                  padding: '8px 0'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. CONNECTED FEATURE JOURNEY WITH BOXES AND PATH LINES
          ========================================================================= */}
      <section style={{
        padding: '80px 0 90px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        <div className="container">
          {/* Section Heading */}
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 56px' }}>
            <span style={{
              color: 'var(--primary-teal)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>
              Step-by-Step Experience
            </span>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.8px', marginBottom: '14px' }}>
              Your Food Journey, Made Better
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Everything you need for a smarter, easier, and more enjoyable food experience.
            </p>
          </div>

          {/* Connected Cards Flow Container */}
          <div style={{ position: 'relative' }}>
            {/* Desktop SVG Connecting Path Line */}
            <svg
              className="journey-path-desktop"
              style={{
                position: 'absolute',
                top: '46px',
                left: '6%',
                width: '88%',
                height: '40px',
                zIndex: 1,
                pointerEvents: 'none'
              }}
              viewBox="0 0 1000 40"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M 20 20 Q 250 5 500 20 T 980 20"
                stroke="url(#journeyGradient)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <defs>
                <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>

            {/* 5 Journey Cards Grid */}
            <div
              className="journey-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '20px',
                position: 'relative',
                zIndex: 2
              }}
            >
              {/* Box 01 */}
              <div className="journey-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="journey-step-number">01</div>
                  <Compass size={22} color="var(--primary-teal)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                  Discover Restaurants
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Explore restaurants, cuisines, and delicious dishes in one place.
                </p>
              </div>

              {/* Box 02 */}
              <div className="journey-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="journey-step-number">02</div>
                  <Wallet size={22} color="var(--primary-teal)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                  Find Meals Within Budget
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Discover food options based on your preferred spending limit.
                </p>
              </div>

              {/* Box 03 */}
              <div className="journey-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="journey-step-number">03</div>
                  <CheckCircle2 size={22} color="var(--cod-green)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                  Order With Cash on Delivery
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Review your cart, confirm your order, and pay with physical cash upon arrival.
                </p>
              </div>

              {/* Box 04 */}
              <div className="journey-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="journey-step-number">04</div>
                  <Truck size={22} color="var(--fresh-cyan)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                  Track Your Order
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '10px' }}>
                  Follow your order through the available order-status updates.
                </p>
                <Link to="/customer/dashboard" style={{ fontSize: '0.8rem', color: 'var(--fresh-cyan)', fontWeight: 700, textDecoration: 'none' }}>
                  View Live Orders →
                </Link>
              </div>

              {/* Box 05 */}
              <div className="journey-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="journey-step-number">05</div>
                  <Leaf size={22} color="var(--surplus-amber)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                  Reduce Food Waste
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Explore surplus-food offers when available and help reduce food waste.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURED RESTAURANTS SECTION
          ========================================================================= */}
      <section id="restaurants" style={{ padding: '70px 0', backgroundColor: 'var(--bg-app)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{
                  color: 'var(--primary-teal)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Curated Kitchens
                </span>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.6px', marginTop: '4px' }}>
                  Featured Restaurants in {selectedCity}
                </h2>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                  Handcrafted meals delivered exclusively within {selectedCity} with reliable Cash on Delivery
                </p>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing {filteredRestaurants.length} active kitchens
              </span>
            </div>

            {/* Cuisine Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {CUISINE_SHORTCUTS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family)',
                    border: selectedCuisine === c ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                    backgroundColor: selectedCuisine === c ? 'var(--primary-teal-light)' : '#ffffff',
                    color: selectedCuisine === c ? 'var(--primary-teal)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && <ErrorBanner message={error} onRetry={fetchData} />}

          {/* Restaurant Grid or Loading Skeletons */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px'
            }}>
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState
              title="No kitchens found"
              message={`We couldn't find any kitchens matching "${searchQuery || selectedCuisine}". Try adjusting your filters.`}
              icon={UtensilsCrossed}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px'
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
                    <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
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
                      <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                        <StatusBadge type="cod" label="Cash on Delivery" />
                      </div>
                      {restaurant.isOpen !== undefined && (
                        <span style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          background: restaurant.isOpen ? 'rgba(16, 185, 129, 0.92)' : 'rgba(239, 68, 68, 0.92)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                          backdropFilter: 'blur(6px)'
                        }}>
                          {restaurant.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.28rem', fontWeight: 700, color: 'var(--deep-navy)' }}>{restaurant.name}</h3>
                        {restaurant.rating !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 700, fontSize: '0.9rem' }}>
                            <Star size={16} fill="#f59e0b" color="#f59e0b" />
                            <span>{restaurant.rating || '4.8'}</span>
                          </div>
                        )}
                      </div>

                      {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
                        fontSize: '0.88rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '18px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                        lineHeight: 1.55
                      }}>
                        {restaurant.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                          <MapPin size={15} />
                          <span>{restaurant.address?.city || 'Downtown'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-teal)', fontSize: '0.88rem', fontWeight: 600 }}>
                          <span>Explore Menu</span>
                          <ChevronRight size={16} />
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
          4. BUDGET-FRIENDLY MEALS SECTION (Light-cyan / Mint treatment)
          ========================================================================= */}
      <section style={{
        padding: '70px 0',
        background: 'linear-gradient(180deg, #ecfeff 0%, #f0fdfa 100%)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{
                color: 'var(--primary-teal)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                Smart Spending
              </span>
              <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.8px', marginBottom: '16px' }}>
                Budget-Friendly Meals, <br />Curated For You
              </h2>
              <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
                No guesswork, no overspending. Discover complete meals and chef specials that match your exact price target across all neighborhood kitchens.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="var(--primary-teal)" />
                  </div>
                  <span style={{ fontSize: '0.94rem', color: 'var(--deep-navy)', fontWeight: 500 }}>
                    Filter by exact budget: ₹150, ₹300, or custom amounts
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="var(--primary-teal)" />
                  </div>
                  <span style={{ fontSize: '0.94rem', color: 'var(--deep-navy)', fontWeight: 500 }}>
                    Vegetarian, non-vegetarian, and dietary preferences
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="var(--primary-teal)" />
                  </div>
                  <span style={{ fontSize: '0.94rem', color: 'var(--deep-navy)', fontWeight: 500 }}>
                    Doorstep Cash on Delivery with transparent delivery fees
                  </span>
                </div>
              </div>

              <Link to="/budget-discovery" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '0.98rem' }}>
                <Flame size={18} /> Find Meals Under My Budget
              </Link>
            </div>

            {/* Visual Budget Teaser Card */}
            <div className="card" style={{ padding: '32px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--deep-navy)' }}>Budget Range Selector</span>
                <span className="badge badge-cod">Smart Filter</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--primary-teal)',
                  background: 'var(--primary-teal-light)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-teal)', fontWeight: 600 }}>Quick Bite</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginTop: '4px' }}>₹150</div>
                </div>
                <div style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Standard</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginTop: '4px' }}>₹300</div>
                </div>
                <div style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Feast</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginTop: '4px' }}>₹500+</div>
                </div>
              </div>
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                💡 Set your target price and our discovery algorithm will automatically pull meals fitting within your limit.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SURPLUS FOOD RESCUE SECTION (Tasteful Amber Accents)
          ========================================================================= */}
      <section style={{ padding: '70px 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div>
              <span style={{
                color: 'var(--surplus-amber)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Zero Food Waste
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.6px', marginTop: '4px' }}>
                Surplus Food Rescue
              </h2>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                Help kitchens end food waste by claiming fresh surplus meals at up to 60% off
              </p>
            </div>
            <Link to="/surplus-rescue" className="btn btn-secondary" style={{ color: 'var(--surplus-amber)', borderColor: 'var(--surplus-amber-border)' }}>
              <HeartHandshake size={18} /> View All Rescue Offers
            </Link>
          </div>

          {surplusListings.length === 0 ? (
            <div className="card" style={{
              padding: '40px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--surplus-amber-bg)',
              borderColor: 'var(--surplus-amber-border)'
            }}>
              <HeartHandshake size={36} color="var(--surplus-amber)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                All Surplus Rescued For Today!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#b45309', maxWidth: '520px', margin: '0 auto 18px' }}>
                Our restaurant partners post excess chef-prepared meals during afternoon and evening transitions. Check back soon to rescue delicious food.
              </p>
              <Link to="/surplus-rescue" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
                Check Rescue Hub
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {surplusListings.map(item => (
                <div key={item._id} className="card" style={{ padding: '24px', borderColor: 'var(--surplus-amber-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-surplus">{item.discountPercent || 'Special Offer'}</span>
                    <span style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 600 }}>
                      {item.minutesRemaining || 'Limited time'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)' }}>₹{item.price}</span>
                      {item.surplusOriginalPrice && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '8px' }}>
                          ₹{item.surplusOriginalPrice}
                        </span>
                      )}
                    </div>
                    <Link to="/surplus-rescue" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
                      Rescue Dish
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          6. WHY CHOOSE FOODIE? (Clean Benefit Grid)
          ========================================================================= */}
      <section style={{ padding: '70px 0', backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span style={{
              color: 'var(--primary-teal)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Why Foodie
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--deep-navy)', letterSpacing: '-0.6px', marginTop: '4px' }}>
              Built for Freshness and Trust
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)' }}>
              A dependable food delivery experience centered on customer convenience and sustainability
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            <div className="card" style={{ padding: '28px 24px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Compass size={24} color="var(--primary-teal)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>Easy Restaurant Discovery</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Explore neighborhood kitchens, curated menus, and chef specialties with verified descriptions and clear cuisine categorization.
              </p>
            </div>

            <div className="card" style={{ padding: '28px 24px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Wallet size={24} color="var(--primary-teal)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>Budget-Conscious Choices</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Never guess what fits your wallet. Our budget discovery engine instantly surfaces the best meals matching your spending target.
              </p>
            </div>

            <div className="card" style={{ padding: '28px 24px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--cod-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <ShieldCheck size={24} color="var(--cod-green)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>Convenient Cash on Delivery</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Inspect your food at your doorstep before handing over cash. No online payment failures, card leaks, or payment gateway stress.
              </p>
            </div>

            <div className="card" style={{ padding: '28px 24px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surplus-amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Leaf size={24} color="var(--surplus-amber)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-navy)', marginBottom: '8px' }}>Sustainable Food Rescue</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Join our mission to end food waste. Reserve perfectly fresh surplus kitchen meals at deep discounts before their countdown ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CALL TO ACTION (CTA)
          ========================================================================= */}
      <section style={{
        padding: '76px 0',
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px', color: '#ffffff' }}>
            Your Next Favorite Meal Is Waiting.
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.92)', marginBottom: '32px', lineHeight: 1.6 }}>
            Browse authentic kitchens in your area and enjoy quick doorstep delivery with 100% Cash on Delivery.
          </p>
          <a href="#restaurants" className="btn" style={{
            backgroundColor: '#ffffff',
            color: 'var(--primary-teal)',
            padding: '14px 34px',
            fontSize: '1.02rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}>
            Explore Restaurants
          </a>
        </div>
      </section>

      {/* =========================================================================
          8. CLEAN PROFESSIONAL FOOTER
          ========================================================================= */}
      <footer style={{
        backgroundColor: 'var(--deep-navy)',
        color: '#94a3b8',
        padding: '50px 0 30px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '40px'
          }}>
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🍔</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>Foodie</span>
              </div>
              <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '14px' }}>
                Fast, fresh gourmet delivery with 100% Cash on Delivery, budget discovery, and surplus food rescue.
              </p>
              <span className="badge badge-cod" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Cash on Delivery Only
              </span>
            </div>

            {/* Quick Links */}
            <div>
              <h5 style={{ color: '#ffffff', fontSize: '0.94rem', fontWeight: 700, marginBottom: '14px' }}>Quick Discovery</h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <li><a href="#restaurants" style={{ color: '#94a3b8', textDecoration: 'none' }}>Featured Kitchens</a></li>
                <li><Link to="/budget-discovery" style={{ color: '#94a3b8', textDecoration: 'none' }}>Budget Meals</Link></li>
                <li><Link to="/surplus-rescue" style={{ color: '#94a3b8', textDecoration: 'none' }}>Surplus Rescue</Link></li>
                <li><Link to="/group-order" style={{ color: '#94a3b8', textDecoration: 'none' }}>Group Ordering</Link></li>
              </ul>
            </div>

            {/* Platform Features */}
            <div>
              <h5 style={{ color: '#ffffff', fontSize: '0.94rem', fontWeight: 700, marginBottom: '14px' }}>Platform Policies</h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <li>Doorstep Cash Settlement</li>
                <li>Zero Online Payment Fees</li>
                <li>Single-Kitchen Cart Rule</li>
                <li>Zero Food Waste Support</li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem'
          }}>
            <span>© {new Date().getFullYear()} Foodie Delivery Platform. All rights reserved.</span>
            <span style={{ color: '#64748b' }}>Strict Cash on Delivery Guaranteed.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
