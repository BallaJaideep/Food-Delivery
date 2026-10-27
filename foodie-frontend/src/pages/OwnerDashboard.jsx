import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CardSkeleton, ErrorBanner, EmptyState, Pagination } from '../components/primitives';
import {
  Store,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  RefreshCw,
  UtensilsCrossed,
  Plus,
  Flame,
  UserCheck,
  AlertCircle,
  Truck,
  Phone,
  MapPin,
  Check,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Camera,
  Upload,
  TrendingUp,
  Percent
} from 'lucide-react';
import { CITIES } from '../constants/cities';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'surplus' | 'menu'
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Pagination for Live Kitchen Feed (Default: 5 per page)
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(5);

  // Surplus publish form states
  const [surplusName, setSurplusName] = useState('');
  const [surplusDesc, setSurplusDesc] = useState('');
  const [surplusOrigPrice, setSurplusOrigPrice] = useState('');
  const [surplusDiscPrice, setSurplusDiscPrice] = useState('');
  const [surplusQty, setSurplusQty] = useState('');
  const [surplusHours, setSurplusHours] = useState('3');
  const [surplusIsVeg, setSurplusIsVeg] = useState(true);
  const [submittingSurplus, setSubmittingSurplus] = useState(false);

  // Menu items list & form state
  const [menuItems, setMenuItems] = useState([]);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishPrepTime, setDishPrepTime] = useState('20');
  const [dishIsVeg, setDishIsVeg] = useState(false);
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [submittingDish, setSubmittingDish] = useState(false);

  // Preset food image samples for quick selection / changing
  const presetFoodPhotos = [
    { label: 'Biryani / Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
    { label: 'Burger / Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
    { label: 'Pizza / Italian', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600' },
    { label: 'Dim Sum / Asian', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600' },
    { label: 'Salad / Bowl', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600' },
    { label: 'Dessert / Pastry', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600' },
    { label: 'Beverage / Shake', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600' },
    { label: 'Curry / Bread', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' }
  ];

  // Preset restaurant cover photos for quick selection / changing
  const presetRestaurantPhotos = [
    { label: 'Modern Bistro', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
    { label: 'Asian Fusion & Wok', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800' },
    { label: 'Pizzeria & Oven', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' },
    { label: 'Gourmet Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
    { label: 'Fine Dining Grill', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' }
  ];

  // Restaurant photo editor modal state
  const [showRestPhotoModal, setShowRestPhotoModal] = useState(false);
  const [restImageUrl, setRestImageUrl] = useState('');
  const [submittingRestPhoto, setSubmittingRestPhoto] = useState(false);

  // Helper to read local image file as Data URL (Base64)
  const handleFileToDataUrl = (file, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result);
    };
    reader.onerror = () => {
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Fetch kitchen orders & restaurants
  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem('foodie_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [ordersRes, restRes, ridersRes, analyticsRes] = await Promise.all([
        fetch('http://localhost:5000/api/orders/restaurant/active', { headers }),
        fetch('http://localhost:5000/api/restaurants/owner/my-restaurants', { headers }),
        fetch('http://localhost:5000/api/operations/riders/available', { headers }),
        fetch('http://localhost:5000/api/operations/analytics/earnings', { headers })
      ]);

      const ordersData = await ordersRes.json();
      const restData = await restRes.json();
      const ridersData = await ridersRes.json();
      const analyticsResData = await analyticsRes.json();

      if (ordersData.success && ordersData.data?.orders) {
        setOrders(ordersData.data.orders);
      }
      if (restData.success && restData.data?.restaurants) {
        setRestaurants(restData.data.restaurants);
        if (!selectedRestaurant && restData.data.restaurants.length > 0) {
          setSelectedRestaurant(restData.data.restaurants[0]);
        }
      }
      if (ridersData.success && ridersData.data?.riders) {
        setAvailableRiders(ridersData.data.riders);
      }
      if (analyticsResData.success && analyticsResData.data) {
        setAnalyticsData(analyticsResData.data);
      }
    } catch (err) {
      console.error('Error fetching kitchen dashboard data:', err);
      setError('Failed to sync live kitchen orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchMenu = async () => {
    if (!selectedRestaurant) return;
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant._id}/menu`);
      const data = await res.json();
      if (data.success) {
        const items = data.data?.menuItems || data.data?.menu || [];
        setMenuItems(items);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  };

  // Fetch menu when restaurant changes
  useEffect(() => {
    fetchMenu();
  }, [selectedRestaurant]);

  // Handle Create or Update Dish
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert('Please select a restaurant first.');
      return;
    }
    setSubmittingDish(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const url = editingDishId
        ? `http://localhost:5000/api/food/${editingDishId}`
        : 'http://localhost:5000/api/food';
      const method = editingDishId ? 'PATCH' : 'POST';

      const payload = {
        restaurant: selectedRestaurant._id,
        name: dishName,
        description: dishDesc,
        price: Number(dishPrice),
        category: dishCategory,
        preparationTimeMinutes: Number(dishPrepTime) || 20,
        isVegetarian: dishIsVeg,
        imageUrl: dishImageUrl.trim()
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage(editingDishId ? 'Dish updated successfully!' : 'New dish added to menu!');
        setTimeout(() => setStatusMessage(null), 3000);
        // Reset form
        setDishName('');
        setDishDesc('');
        setDishPrice('');
        setDishCategory('Main Course');
        setDishPrepTime('20');
        setDishIsVeg(false);
        setDishImageUrl('');
        setEditingDishId(null);
        setShowAddDishModal(false);
        fetchMenu();
      } else {
        alert(data.message || 'Failed to save dish.');
      }
    } catch (err) {
      console.error('Save dish error:', err);
      alert('Error saving dish item.');
    } finally {
      setSubmittingDish(false);
    }
  };

  // Handle Save / Update Restaurant Cover Image
  const handleSaveRestaurantPhoto = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setSubmittingRestPhoto(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: restImageUrl.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.data?.restaurant) {
        setStatusMessage('Restaurant cover photo updated successfully!');
        setTimeout(() => setStatusMessage(null), 3000);
        setSelectedRestaurant(data.data.restaurant);
        setShowRestPhotoModal(false);
        fetchDashboardData(true);
      } else {
        alert(data.message || 'Failed to update restaurant photo.');
      }
    } catch (err) {
      console.error('Restaurant photo update error:', err);
      alert('Error updating restaurant photo.');
    } finally {
      setSubmittingRestPhoto(false);
    }
  };

  // Toggle dish availability
  const handleToggleDishAvailability = async (item) => {
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/food/${item._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !item.isAvailable })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Item "${item.name}" marked ${!item.isAvailable ? 'In Stock' : 'Out of Stock'}!`);
        setTimeout(() => setStatusMessage(null), 2500);
        fetchMenu();
      } else {
        alert(data.message || 'Failed to update item availability.');
      }
    } catch (err) {
      console.error('Toggle dish availability error:', err);
      alert('Error updating dish availability.');
    }
  };

  // Delete dish item
  const handleDeleteDish = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to remove "${itemName}" from the menu?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/food/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`"${itemName}" deleted from menu.`);
        setTimeout(() => setStatusMessage(null), 2500);
        fetchMenu();
      } else {
        alert(data.message || 'Failed to delete dish.');
      }
    } catch (err) {
      console.error('Delete dish error:', err);
      alert('Error deleting dish item.');
    }
  };

  // Pre-fill form for editing dish
  const handleEditDish = (item) => {
    setEditingDishId(item._id);
    setDishName(item.name || '');
    setDishDesc(item.description || '');
    setDishPrice(item.price || '');
    setDishCategory(item.category || 'Main Course');
    setDishPrepTime(String(item.preparationTimeMinutes || 20));
    setDishIsVeg(Boolean(item.isVegetarian));
    setDishImageUrl(item.imageUrl || '');
    setShowAddDishModal(true);
  };

  // Update order status: ACCEPTED, PREPARING, READY_FOR_PICKUP, REJECTED
  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage(`Order updated to ${targetStatus}!`);
        setTimeout(() => setStatusMessage(null), 3000);
        fetchDashboardData(true);
      } else {
        alert(data.message || 'Status transition error');
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Error updating order status.');
    }
  };

  // Assign delivery rider
  const handleAssignRider = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return;
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/operations/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryPartnerId })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage('Delivery partner dispatched!');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchDashboardData(true);
      } else {
        alert(data.message || 'Failed to assign rider');
      }
    } catch (err) {
      console.error('Failed to assign rider:', err);
      alert('Error assigning rider.');
    }
  };

  // Publish Surplus Food
  const handlePublishSurplus = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert('Please select a restaurant first.');
      return;
    }

    setSubmittingSurplus(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const payload = {
        restaurantId: selectedRestaurant._id,
        name: surplusName.trim(),
        description: surplusDesc.trim(),
        originalPrice: parseFloat(surplusOrigPrice),
        discountPrice: parseFloat(surplusDiscPrice),
        quantityAvailable: parseInt(surplusQty, 10),
        availableHours: parseInt(surplusHours, 10),
        isVegetarian: surplusIsVeg
      };

      const res = await fetch('http://localhost:5000/api/operations/surplus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage('Surplus meal published successfully for customer rescue!');
        setTimeout(() => setStatusMessage(null), 3500);
        setSurplusName('');
        setSurplusDesc('');
        setSurplusOrigPrice('');
        setSurplusDiscPrice('');
        setSurplusQty('');
        setActiveTab('orders');
      } else {
        alert(data.message || 'Failed to publish surplus listing.');
      }
    } catch (err) {
      console.error('Surplus publish error:', err);
      alert('Error publishing surplus item.');
    } finally {
      setSubmittingSurplus(false);
    }
  };

  // Order Counts
  const pendingOrders = orders.filter(o => o.orderStatus === 'PLACED');
  const kitchenCooking = orders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.orderStatus));
  const readyOrders = orders.filter(o => ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP'].includes(o.orderStatus));

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1160px' }}>
        
        {/* Header Profile Bar */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'var(--primary-teal-light)',
                color: 'var(--primary-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Store size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    {selectedRestaurant ? selectedRestaurant.name : `Chef ${user?.name}`}
                  </h1>
                  <span className="badge badge-cod">Kitchen Active</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Live Orders, Preparation Pipeline, Rider Dispatch, & Surplus Food Rescue
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Swiggy Style Multi-City Switcher for Owner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--primary-teal-light)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary-teal)'
              }}>
                <MapPin size={15} color="var(--primary-teal)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-teal)', textTransform: 'uppercase' }}>City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setSelectedCity(newCity);
                    const matchingRest = restaurants.find(r => newCity === 'All' || r.address?.city?.toLowerCase() === newCity.toLowerCase());
                    if (matchingRest) {
                      setSelectedRestaurant(matchingRest);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--deep-navy)',
                    fontWeight: 750,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Active Cities ({restaurants.length} kitchens)</option>
                  {CITIES.filter(c => restaurants.some(r => r.address?.city?.toLowerCase() === c.name.toLowerCase())).map(c => {
                    const countInCity = restaurants.filter(r => r.address?.city?.toLowerCase() === c.name.toLowerCase()).length;
                    return (
                      <option key={c.name} value={c.name}>
                        📍 {c.name} ({countInCity} {countInCity === 1 ? 'kitchen' : 'kitchens'})
                      </option>
                    );
                  })}
                  {/* If there are any custom cities not in the predefined list */}
                  {Array.from(new Set(restaurants.map(r => r.address?.city).filter(Boolean)))
                    .filter(cityName => !CITIES.some(c => c.name.toLowerCase() === cityName.toLowerCase()))
                    .map(cityName => {
                      const countInCity = restaurants.filter(r => r.address?.city === cityName).length;
                      return (
                        <option key={cityName} value={cityName}>
                          📍 {cityName} ({countInCity} {countInCity === 1 ? 'kitchen' : 'kitchens'})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Kitchen Selector (Filtered by selectedCity) */}
              {(() => {
                const visibleKitchens = selectedCity === 'All'
                  ? restaurants
                  : restaurants.filter(r => r.address?.city?.toLowerCase() === selectedCity.toLowerCase());

                return (
                  <select
                    value={selectedRestaurant?._id || ''}
                    onChange={(e) => {
                      const found = restaurants.find(r => r._id === e.target.value);
                      if (found) setSelectedRestaurant(found);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--deep-navy)',
                      backgroundColor: '#ffffff',
                      maxWidth: '300px'
                    }}
                  >
                    {visibleKitchens.map(r => (
                      <option key={r._id} value={r._id}>
                        🍳 {r.name} ({r.address?.city || 'No City'})
                      </option>
                    ))}
                  </select>
                );
              })()}

              {selectedRestaurant && (
                <button
                  onClick={() => {
                    setRestImageUrl(selectedRestaurant.imageUrl || '');
                    setShowRestPhotoModal(true);
                  }}
                  className="btn btn-outline"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Change restaurant cover banner"
                >
                  <Camera size={14} color="var(--primary-teal)" />
                  <span>Cover Photo</span>
                </button>
              )}

              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 14px',
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
                <span>{refreshing ? 'Syncing...' : 'Live Sync'}</span>
              </button>
            </div>
          </div>

          {/* Restaurant Cover Photo Banner Preview */}
          {selectedRestaurant?.imageUrl && (
            <div style={{
              marginTop: '16px',
              height: '110px',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0f172a'
            }}>
              <img
                src={selectedRestaurant.imageUrl}
                alt={selectedRestaurant.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '14px',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}>
                Current Public Cover Banner
              </div>
            </div>
          )}
        </div>

        {/* Modal: Edit Restaurant Cover Photo */}
        {showRestPhotoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              maxWidth: '560px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Restaurant Cover Photo
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Optional & Changeable Anytime (Supports Web Link or Local File Upload)
                  </span>
                </div>
                <button
                  onClick={() => setShowRestPhotoModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRestaurantPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Method 1: Web Link */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Option A: Paste Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or paste image link"
                    value={restImageUrl}
                    onChange={(e) => setRestImageUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Method 2: Local File Upload */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Option B: Upload Local Image File
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: '1.5px dashed var(--primary-teal)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-teal-light)',
                    cursor: 'pointer',
                    color: 'var(--primary-teal)',
                    fontSize: '0.86rem',
                    fontWeight: 700
                  }}>
                    <Upload size={16} />
                    Choose Image File from Computer
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileToDataUrl(file, (dataUrl) => {
                            setRestImageUrl(dataUrl);
                          });
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Presets */}
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Or select a suggested theme banner:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {presetRestaurantPhotos.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRestImageUrl(preset.url)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: restImageUrl === preset.url ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                          backgroundColor: restImageUrl === preset.url ? 'var(--primary-teal-light)' : '#ffffff',
                          color: restImageUrl === preset.url ? 'var(--primary-teal)' : 'var(--deep-navy)'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {restImageUrl && (
                  <div style={{
                    position: 'relative',
                    height: '140px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#0f172a'
                  }}>
                    <img
                      src={restImageUrl}
                      alt="Banner Preview"
                      onError={(e) => { e.target.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setRestImageUrl('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRestPhotoModal(false)}
                    className="btn btn-outline"
                    style={{ padding: '9px 18px', fontSize: '0.88rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRestPhoto}
                    className="btn btn-primary"
                    style={{ padding: '9px 22px', fontSize: '0.88rem' }}
                  >
                    {submittingRestPhoto ? 'Updating...' : 'Save Restaurant Photo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast Message */}
        {statusMessage && (
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
            <span>{statusMessage}</span>
          </div>
        )}

        {/* ================= RESTAURANT EARNINGS & COD SETTLEMENT BREAKDOWN ================= */}
        <div className="card" style={{ padding: '26px', marginBottom: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary-teal)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Kitchen Net Earnings & COD Settlements
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Your kitchen receives <strong>85% of dish subtotal</strong> for each delivered order once the safe deposit is reconciled by Platform Admin.
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
            const myPayout = period.myEarnings ?? period.restaurantPayout ?? 0;
            const reconciledGross = period.reconciledGross || 0;
            const pendingSafe = period.pendingReconciliation || 0;
            const totalOrders = period.totalOrders || 0;
            const reconciledOrdersCount = period.reconciledOrdersCount || 0;

            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* Reconciled Kitchen Take-Home */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                        🍳 Reconciled Net Payout (85%)
                      </span>
                      <Store size={16} color="#16a34a" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#15803d' }}>
                      ₹{myPayout.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                      Cleared & unlocked by Admin
                    </span>
                  </div>

                  {/* Reconciled Gross COD */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: 'var(--primary-teal-light)', border: '1px solid rgba(13, 148, 136, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary-teal)', textTransform: 'uppercase' }}>
                        Total Food COD Cleared
                      </span>
                      <Package size={16} color="var(--primary-teal)" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                      ₹{reconciledGross.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Across {reconciledOrdersCount} reconciled orders
                    </span>
                  </div>

                  {/* Pending Admin Safe Reconciliation */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                        Pending Admin Reconciliation
                      </span>
                      <Clock size={16} color="#d97706" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b45309' }}>
                      ₹{pendingSafe.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#92400e' }}>
                      Cash collected by riders awaiting safe audit
                    </span>
                  </div>

                  {/* Total Order Volume */}
                  <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Orders Volume
                      </span>
                      <ChefHat size={16} color="var(--deep-navy)" />
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                      {totalOrders}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      In selected {selectedTimeframe.replace('this', '').toLowerCase()} window
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
                  <AlertCircle size={15} color="var(--primary-teal)" />
                  <span>
                    <strong>Settlement Note:</strong> Restaurant disbursements become officially claimable after physical cash is verified by platform administration. 15% platform commission and rider delivery fees are deducted automatically.
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Quick Operational Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger-red)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Acceptance
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--deep-navy)', marginTop: '4px' }}>
              {pendingOrders.length}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-teal)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              In Kitchen (Cooking)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-teal)', marginTop: '4px' }}>
              {kitchenCooking.length}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--fresh-cyan)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Ready / Out for Delivery
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--fresh-cyan)', marginTop: '4px' }}>
              {readyOrders.length}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--cod-green)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Online Riders Nearby
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cod-green)', marginTop: '4px' }}>
              {availableRiders.length}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            Live Kitchen Feed ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('surplus')}
            className={`btn ${activeTab === 'surplus' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            <Flame size={16} /> Publish Surplus Rescue
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            <UtensilsCrossed size={16} /> Kitchen Menu ({menuItems.length})
          </button>
        </div>

        {/* ================= TAB 1: LIVE KITCHEN FEED ================= */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <Clock size={40} color="var(--primary-teal)" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '6px' }}>
                  No Incoming Orders Right Now
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Kitchen is standing by. When customers place COD orders, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders
                    .slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize)
                    .map((order) => {
                  const isPlaced = order.orderStatus === 'PLACED';
                  const isAccepted = order.orderStatus === 'ACCEPTED';
                  const isPreparing = order.orderStatus === 'PREPARING';
                  const isReady = order.orderStatus === 'READY_FOR_PICKUP';
                  const isAssigned = order.orderStatus === 'ASSIGNED';
                  const isDelivered = order.orderStatus === 'DELIVERED';

                  return (
                    <div
                      key={order._id}
                      className="card"
                      style={{
                        padding: '24px',
                        borderLeft: isPlaced
                          ? '5px solid var(--danger-red)'
                          : isPreparing
                          ? '5px solid var(--primary-teal)'
                          : isReady
                          ? '5px solid var(--fresh-cyan)'
                          : '1px solid var(--border-subtle)'
                      }}
                    >
                      {/* Order Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                              #{order.orderNumber}
                            </span>
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: isPlaced ? 'rgba(239, 68, 68, 0.12)' : 'var(--primary-teal-light)',
                              color: isPlaced ? 'var(--danger-red)' : 'var(--primary-teal)'
                            }}>
                              {order.orderStatus}
                            </span>
                            <span className="badge badge-cod">COD: ₹{order.totalAmount}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Customer: <strong>{order.customer?.name}</strong> ({order.customer?.phone || 'No phone'}) • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Status Pipeline Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isPlaced && (
                            <>
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'ACCEPTED')}
                                className="btn btn-primary"
                                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                              >
                                <Check size={14} /> Accept Order
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'REJECTED')}
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '0.84rem',
                                  border: '1px solid var(--danger-red)',
                                  backgroundColor: '#ffffff',
                                  color: 'var(--danger-red)',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'PREPARING')}
                              className="btn btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                            >
                              <ChefHat size={14} /> Start Cooking
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'READY_FOR_PICKUP')}
                              className="btn btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.84rem', backgroundColor: 'var(--fresh-cyan)', borderColor: 'var(--fresh-cyan)' }}
                            >
                              <Package size={14} /> Mark Cooked & Packed
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items & Address Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingTop: '16px' }}>
                        {/* Ordered Dishes */}
                        <div>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Kitchen Ticket ({order.items?.length || 0} items)
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            {order.items?.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span>
                                  <strong>{item.quantity}×</strong> {item.name}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--deep-navy)' }}>
                                  ₹{item.itemTotal || (item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {order.notes && (
                            <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '4px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#b45309' }}>
                              <strong>Kitchen Note:</strong> {order.notes}
                            </div>
                          )}
                        </div>

                        {/* Doorstep Destination & Rider Assignment */}
                        <div>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Delivery & Rider Dispatch
                          </span>
                          <div style={{ fontSize: '0.84rem', color: 'var(--deep-navy)', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} color="var(--primary-teal)" />
                              <span>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</span>
                            </div>
                          </div>

                          {/* Delivery Partner Status */}
                          <div style={{ marginTop: '12px' }}>
                            {order.deliveryPartner ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                                <Truck size={16} color="var(--cod-green)" />
                                <span>Rider: <strong>{order.deliveryPartner.name}</strong></span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <select
                                  id={`rider-select-${order._id}`}
                                  defaultValue=""
                                  style={{
                                    padding: '7px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-medium)',
                                    fontSize: '0.8rem',
                                    maxWidth: '200px'
                                  }}
                                >
                                  <option value="" disabled>Select Delivery Rider...</option>
                                  {availableRiders.map(r => (
                                    <option key={r._id} value={r._id}>
                                      {r.deliveryPartnerDetails?.isAvailable ? '🟢 Online: ' : '⚪ Offline: '} {r.name} ({r.deliveryPartnerDetails?.vehicleType || 'Motorbike'})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    const sel = document.getElementById(`rider-select-${order._id}`);
                                    if (sel && sel.value) handleAssignRider(order._id, sel.value);
                                    else alert('Please pick a rider from the dropdown list.');
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Dispatch Rider
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kitchen Feed Pagination */}
              <Pagination
                currentPage={ordersPage}
                totalItems={orders.length}
                pageSize={ordersPageSize}
                onPageChange={(p) => setOrdersPage(p)}
                pageSizeOptions={[5, 10, 20]}
                onPageSizeChange={(newSize) => {
                  setOrdersPageSize(newSize);
                  setOrdersPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

        {/* ================= TAB 2: SURPLUS RESCUE PUBLISHER ================= */}
        {activeTab === 'surplus' && (
          <div className="card" style={{ padding: '32px', maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--surplus-amber-bg)',
                color: 'var(--surplus-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Flame size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                  Publish Surplus Food Rescue Meal
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Sell leftover gourmet dishes at a high discount to avoid food waste and recover kitchen costs
                </p>
              </div>
            </div>

            <form onSubmit={handlePublishSurplus} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                  Surplus Meal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. [Evening Rescue] 10× Artisan Steamed Dim Sum Pack"
                  value={surplusName}
                  onChange={(e) => setSurplusName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                  Description & Quality Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Freshly prepared during dinner rush, kept at safe holding temperature."
                  value={surplusDesc}
                  onChange={(e) => setSurplusDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Original Menu Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 380"
                    value={surplusOrigPrice}
                    onChange={(e) => setSurplusOrigPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Discount Rescue Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150"
                    value={surplusDiscPrice}
                    onChange={(e) => setSurplusDiscPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Packs Available *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4"
                    value={surplusQty}
                    onChange={(e) => setSurplusQty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Valid For (Hours) *
                  </label>
                  <select
                    value={surplusHours}
                    onChange={(e) => setSurplusHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={surplusIsVeg}
                  onChange={(e) => setSurplusIsVeg(e.target.checked)}
                  style={{ accentColor: 'var(--primary-teal)', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.88rem', color: 'var(--deep-navy)', fontWeight: 600 }}>Pure Vegetarian Dish</span>
              </label>

              <button
                type="submit"
                disabled={submittingSurplus}
                className="btn btn-primary"
                style={{
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginTop: '10px',
                  backgroundColor: 'var(--surplus-amber)',
                  borderColor: 'var(--surplus-amber)'
                }}
              >
                {submittingSurplus ? 'Publishing Rescue Listing...' : 'Publish Surplus to Public Feed'}
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 3: MENU MANAGEMENT ================= */}
        {activeTab === 'menu' && (
          <div>
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 4px' }}>
                  Live Kitchen Menu ({menuItems.length} items)
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Manage dish pricing, descriptions, stock availability, or add new recipes.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingDishId(null);
                  setDishName('');
                  setDishDesc('');
                  setDishPrice('');
                  setDishCategory('Main Course');
                  setDishPrepTime('20');
                  setDishIsVeg(false);
                  setShowAddDishModal(true);
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
              >
                <Plus size={18} />
                Add New Dish
              </button>
            </div>

            {/* Modal / Form for Add / Edit Dish */}
            {showAddDishModal && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid var(--primary-teal)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    {editingDishId ? 'Edit Dish Details' : 'Add New Dish to Menu'}
                  </h4>
                  <button
                    onClick={() => {
                      setShowAddDishModal(false);
                      setEditingDishId(null);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveDish} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Dish Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Claypot Chicken Rice"
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 299"
                        value={dishPrice}
                        onChange={(e) => setDishPrice(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Slow-cooked tender chicken, jasmine rice, scallions, sweet dark soy glaze."
                      value={dishDesc}
                      onChange={(e) => setDishDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Category *
                      </label>
                      <select
                        value={dishCategory}
                        onChange={(e) => setDishCategory(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="Starters">Starters</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Breads & Rice">Breads & Rice</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                        Prep Time (Minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={dishPrepTime}
                        onChange={(e) => setDishPrepTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dishIsVeg}
                      onChange={(e) => setDishIsVeg(e.target.checked)}
                      style={{ accentColor: 'var(--primary-teal)', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.88rem', color: 'var(--deep-navy)', fontWeight: 600 }}>Pure Vegetarian Dish</span>
                  </label>

                  {/* Optional Image Input Section */}
                  <div style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <Camera size={14} color="var(--primary-teal)" />
                        Dish Image URL <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(Optional & Changeable Anytime)</span>
                      </label>
                      {dishImageUrl && (
                        <button
                          type="button"
                          onClick={() => setDishImageUrl('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger-red)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Clear Image
                        </button>
                      )}
                    </div>

                    {/* Dual Option: Web link OR Local File Upload */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="url"
                        placeholder="Option A: Paste image link"
                        value={dishImageUrl}
                        onChange={(e) => setDishImageUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.86rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 12px',
                        border: '1.5px dashed var(--primary-teal)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-teal-light)',
                        cursor: 'pointer',
                        color: 'var(--primary-teal)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        <Upload size={15} />
                        Option B: Upload File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileToDataUrl(file, (dataUrl) => {
                                setDishImageUrl(dataUrl);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick preset photo selector */}
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Or click a suggested photo to apply:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {presetFoodPhotos.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDishImageUrl(preset.url)}
                            style={{
                              padding: '4px 9px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: dishImageUrl === preset.url ? '1.5px solid var(--primary-teal)' : '1px solid var(--border-subtle)',
                              backgroundColor: dishImageUrl === preset.url ? 'var(--primary-teal-light)' : '#ffffff',
                              color: dishImageUrl === preset.url ? 'var(--primary-teal)' : 'var(--deep-navy)'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image live preview */}
                    {dishImageUrl && (
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={dishImageUrl}
                          alt="Preview"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--border-medium)'
                          }}
                        />
                        <div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#16a34a', display: 'block' }}>
                            ✓ Image Preview Active
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            You can change or replace this link anytime.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      disabled={submittingDish}
                      className="btn btn-primary"
                      style={{ padding: '10px 24px', fontSize: '0.92rem' }}
                    >
                      {submittingDish ? 'Saving Dish...' : (editingDishId ? 'Save Changes' : 'Publish Dish to Menu')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDishModal(false);
                        setEditingDishId(null);
                        setDishImageUrl('');
                      }}
                      className="btn btn-outline"
                      style={{ padding: '10px 18px', fontSize: '0.92rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {menuItems.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Menu is Empty"
                description="No dishes have been added to this kitchen yet. Click 'Add New Dish' to publish your recipes."
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
                {menuItems.map(item => (
                  <div key={item._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: item.isAvailable ? 1 : 0.72 }}>
                    <div>
                      {/* Dish Image Banner (Optional) */}
                      {item.imageUrl ? (
                        <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', height: '140px', backgroundColor: '#f1f5f9' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => handleEditDish(item)}
                            title="Change photo"
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Camera size={12} />
                            Change
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          marginBottom: '12px',
                          borderRadius: '8px',
                          height: '60px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px dashed var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 12px'
                        }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ImageIcon size={14} />
                            No photo attached (Optional)
                          </span>
                          <button
                            onClick={() => handleEditDish(item)}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--primary-teal)',
                              cursor: 'pointer'
                            }}
                          >
                            + Add Photo
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {item.category}
                        </span>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: item.isAvailable ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: item.isAvailable ? '#16a34a' : '#ef4444'
                        }}>
                          {item.isAvailable ? '● In Stock' : '○ Out of Stock'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: item.isVegetarian ? '#16a34a' : '#ef4444'
                        }} title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'} />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                          {item.name}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                        {item.description || 'Freshly prepared kitchen specialty.'}
                      </p>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)' }}>
                          ₹{item.price}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ⏱ {item.preparationTimeMinutes || 20} min
                        </span>
                      </div>

                      {/* Management Controls */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <button
                          onClick={() => handleToggleDishAvailability(item)}
                          title={item.isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                          className="btn btn-outline"
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {item.isAvailable ? <ToggleRight size={16} color="#16a34a" /> : <ToggleLeft size={16} color="#ef4444" />}
                          {item.isAvailable ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => handleEditDish(item)}
                          title="Edit Dish"
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteDish(item._id, item.name)}
                          title="Delete Dish"
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.76rem',
                            color: 'var(--danger-red)',
                            borderColor: 'rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

