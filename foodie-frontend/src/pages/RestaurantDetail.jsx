import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  Store,
  Star,
  MapPin,
  Clock,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  Leaf,
  Flame,
  Search,
  AlertCircle
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner } from '../components/primitives';

export const RestaurantDetail = () => {
  const { id } = useParams();
  const { cartItems, addItem, updateQuantity, restaurant: cartRestaurant } = useCart();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [addedItemNotification, setAddedItemNotification] = useState(null);

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const [restRes, menuRes] = await Promise.all([
          fetch(`http://localhost:5000/api/restaurants/${id}`),
          fetch(`http://localhost:5000/api/restaurants/${id}/menu`)
        ]);

        const restData = await restRes.json();
        const menuData = await menuRes.json();

        if (restData.success && restData.data?.restaurant) {
          setRestaurant(restData.data.restaurant);
        } else {
          setError(restData.message || 'Restaurant not found.');
        }

        if (menuData.success) {
          const items = menuData.data?.menuItems || menuData.data?.menu || [];
          setMenuItems(items);
        }
      } catch (err) {
        console.error('Failed to load restaurant details:', err);
        setError('Connection error while fetching kitchen details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndMenu();
  }, [id]);

  // Extract distinct categories
  const categories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesVeg = !vegOnly || item.isVegetarian;
    const matchesSearch = !searchFilter ||
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchFilter.toLowerCase()));

    return matchesCategory && matchesVeg && matchesSearch;
  });

  const handleAddItem = (item) => {
    if (!restaurant) return;
    const success = addItem(item, {
      _id: restaurant._id,
      name: restaurant.name,
      address: restaurant.address
    });
    if (success) {
      setAddedItemNotification(item.name);
      setTimeout(() => setAddedItemNotification(null), 2500);
    }
  };

  const getItemQuantityInCart = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <CardSkeleton height="260px" style={{ marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            <CardSkeleton height="160px" />
            <CardSkeleton height="160px" />
            <CardSkeleton height="160px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-app)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '580px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 24px' }}>
            <AlertCircle size={44} color="var(--danger-red)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '8px' }}>
              Kitchen Not Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px' }}>
              {error || 'This kitchen profile is currently unavailable.'}
            </p>
            <Link to="/customer/dashboard" className="btn btn-primary" style={{ padding: '10px 22px' }}>
              Back to Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '28px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '18px' }}>
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
            <ChevronLeft size={16} /> Back to Dining Hub
          </button>
        </div>

        {/* Floating Notification */}
        {addedItemNotification && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: 'var(--deep-navy)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <Check size={18} color="var(--primary-teal)" />
            <span>Added "{addedItemNotification}" to Cart</span>
            <Link to="/cart" style={{ color: 'var(--fresh-cyan)', textDecoration: 'none', marginLeft: '8px', fontWeight: 700 }}>
              View Cart →
            </Link>
          </div>
        )}

        {/* Restaurant Hero Profile Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ position: 'relative', height: '260px' }}>
            <img
              src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
              alt={restaurant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)'
            }} />
            <div style={{ position: 'absolute', bottom: '24px', left: '28px', right: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <StatusBadge type="cod" label="Strict Cash on Delivery" />
                  {restaurant.isOpen ? (
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#10b981', color: '#ffffff' }}>
                      KITCHEN OPEN
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#ffffff' }}>
                      CURRENTLY CLOSED
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
                  {restaurant.name}
                </h1>
                <p style={{ fontSize: '0.92rem', color: '#cbd5e1', margin: 0, maxWidth: '600px' }}>
                  {restaurant.description || 'Authentic multi-course dishes, handcrafted with fresh daily ingredients.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '10px 18px', borderRadius: 'var(--radius-md)', color: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{restaurant.rating || '4.6'}</span>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem' }}>
                  <Clock size={16} />
                  <span>25-35 mins</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 28px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.86rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="var(--primary-teal)" />
                <span style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>
                  {restaurant.address?.street}, {restaurant.address?.city}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.address?.street || ''}, ${restaurant.address?.city || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--primary-teal)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    marginLeft: '4px',
                    padding: '2px 8px',
                    backgroundColor: 'var(--primary-teal-light)',
                    borderRadius: '4px'
                  }}
                >
                  View on Maps ↗
                </a>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0d9488',
                backgroundColor: '#f0fdfa',
                border: '1px solid #99f6e4',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)'
              }}>
                📍 Delivers only in {restaurant.address?.city}
              </span>
              {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Cuisines:</span>
                  <span>{restaurant.cuisine.join(', ')}</span>
                </div>
              )}
            </div>

            <Link
              to="/cart"
              className="btn btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={16} />
              <span>Go to Cart ({cartItems.length})</span>
            </Link>
          </div>
        </div>

        {/* Menu Controls: Search, Veg Toggle, Category Tabs */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            {/* Search within Menu */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={17} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search dishes inside this kitchen..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Veg Only Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: vegOnly ? '1.5px solid #16a34a' : '1px solid var(--border-subtle)',
                backgroundColor: vegOnly ? 'rgba(22, 163, 74, 0.1)' : '#ffffff',
                color: vegOnly ? '#15803d' : 'var(--deep-navy)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Leaf size={16} color={vegOnly ? '#16a34a' : 'var(--text-muted)'} />
              <span>Pure Veg Only</span>
            </button>
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: activeCategory === category ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                  backgroundColor: activeCategory === category ? 'var(--primary-teal-light)' : '#ffffff',
                  color: activeCategory === category ? 'var(--primary-teal)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === category ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
              {activeCategory === 'All' ? 'Full Kitchen Menu' : `${activeCategory} Specials`} ({filteredItems.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--cod-green)', fontWeight: 700 }}>
              ✓ Cash on Delivery at Doorstep
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                No food items match the current category or vegetarian filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredItems.map((item) => {
                const qtyInCart = getItemQuantityInCart(item._id);

                return (
                  <div
                    key={item._id}
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-subtle)',
                      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
                    }}
                  >
                    <div>
                      {/* Optional Dish Image */}
                      {item.imageUrl && (
                        <div style={{
                          marginBottom: '14px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          height: '150px',
                          backgroundColor: 'var(--bg-app)'
                        }}>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}

                      {/* Dietary Indicator & Category */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: item.isVegetarian ? '1.5px solid #16a34a' : '1.5px solid #dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: item.isVegetarian ? '#16a34a' : '#dc2626'
                            }} />
                          </span>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {item.category}
                          </span>
                        </div>

                        {item.preparationTimeMinutes && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {item.preparationTimeMinutes}m prep
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 6px' }}>
                        {item.name}
                      </h3>

                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 16px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.description || 'Prepared fresh by the head chef with organic spices and premium ingredients.'}
                      </p>
                    </div>

                    {/* Price & Add to Cart Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
                          Price (COD)
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                          ₹{item.price}
                        </span>
                      </div>

                      {qtyInCart > 0 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: 'var(--primary-teal-light)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 12px',
                          border: '1.5px solid var(--primary-teal)'
                        }}>
                          <button
                            onClick={() => updateQuantity(item._id, qtyInCart - 1)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--deep-navy)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px'
                            }}
                          >
                            <Minus size={15} />
                          </button>
                          <span style={{ fontWeight: 800, color: 'var(--deep-navy)', fontSize: '0.94rem', minWidth: '18px', textAlign: 'center' }}>
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, qtyInCart + 1)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--primary-teal)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px'
                            }}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!restaurant.isOpen || !item.isAvailable}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 18px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: (!restaurant.isOpen || !item.isAvailable) ? 0.6 : 1,
                            cursor: (!restaurant.isOpen || !item.isAvailable) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Plus size={15} />
                          <span>Add to Feast</span>
                        </button>
                      )}
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
export default RestaurantDetail;
