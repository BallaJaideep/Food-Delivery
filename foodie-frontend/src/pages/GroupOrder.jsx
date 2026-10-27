import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Layers,
  Users,
  Plus,
  Share2,
  Copy,
  Clock,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  ChevronLeft,
  Minus,
  X,
  Utensils,
  LogOut,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState, ErrorBanner } from '../components/primitives';

export const GroupOrder = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { code: urlCode } = useParams();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [openGroups, setOpenGroups] = useState([]);
  const [loadingOpenGroups, setLoadingOpenGroups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Checkout address state
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || '');
  const [city, setCity] = useState(user?.addresses?.[0]?.city || 'Metro Hub');
  const [checkingOut, setCheckingOut] = useState(false);

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [restaurantMenu, setRestaurantMenu] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [savingDishes, setSavingDishes] = useState(false);
  const [participantItemsDraft, setParticipantItemsDraft] = useState([]);

  // Fetch available restaurants & open groups
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/restaurants');
        const data = await res.json();
        if (data.success && data.data?.restaurants) {
          setRestaurants(data.data.restaurants);
          if (data.data.restaurants.length > 0) {
            setSelectedRestaurantId(data.data.restaurants[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurants for group ordering:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch currently open groups for public 1-click joining
  const fetchOpenGroups = async () => {
    setLoadingOpenGroups(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch('http://localhost:5000/api/orders/group/open-groups', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.data?.groups) {
        setOpenGroups(data.data.groups);
      }
    } catch (err) {
      console.error('Failed to load open groups:', err);
    } finally {
      setLoadingOpenGroups(false);
    }
  };

  useEffect(() => {
    if (!activeGroup) {
      fetchOpenGroups();
    }
  }, [activeGroup]);

  // Handle URL code direct join (e.g. /group-order/GRP-1234)
  useEffect(() => {
    if (urlCode && !activeGroup) {
      handleDirectJoin(urlCode);
    }
  }, [urlCode]);

  // Restore active group from localStorage ONLY IF the logged-in user is actually part of it
  useEffect(() => {
    if (!user?._id) {
      setActiveGroup(null);
      return;
    }
    const savedGroup = localStorage.getItem('foodie_active_group');
    if (savedGroup) {
      try {
        const parsed = JSON.parse(savedGroup);
        if (parsed?.groupCode) {
          const userIdStr = user._id.toString();
          const creatorId = parsed.creator?._id || parsed.creator;
          const isCreator = creatorId && creatorId.toString() === userIdStr;
          const isParticipant = Array.isArray(parsed.participants) && parsed.participants.some(
            p => (p.user?._id || p.user)?.toString() === userIdStr || p.name === user.name
          );

          if (isCreator || isParticipant) {
            setActiveGroup(parsed);
          } else {
            // User was not part of this group (e.g. another user logged in on the same browser)
            localStorage.removeItem('foodie_active_group');
            setActiveGroup(null);
          }
        }
      } catch (e) {
        localStorage.removeItem('foodie_active_group');
      }
    }
  }, [user?._id]);

  // Poll active group details if viewing one & verify membership
  useEffect(() => {
    if (!activeGroup?.groupCode || !user?._id) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('foodie_token');
        const res = await fetch(`http://localhost:5000/api/orders/group/${activeGroup.groupCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data?.group) {
          const grp = data.data.group;
          const userIdStr = user._id.toString();
          const creatorId = grp.creator?._id || grp.creator;
          const isCreator = creatorId && creatorId.toString() === userIdStr;
          const isParticipant = Array.isArray(grp.participants) && grp.participants.some(
            p => (p.user?._id || p.user)?.toString() === userIdStr || p.name === user.name
          );

          if (isCreator || isParticipant) {
            setActiveGroup(grp);
            localStorage.setItem('foodie_active_group', JSON.stringify(grp));
          } else {
            // Logged-in user is not part of this group; do not show active group screen
            localStorage.removeItem('foodie_active_group');
            setActiveGroup(null);
          }
        }
      } catch (err) {
        console.error('Group sync error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeGroup?.groupCode, user?._id]);

  // Open Dish Selector Modal & Load Menu
  const openMenuModal = async () => {
    const restId = activeGroup?.restaurant?._id || activeGroup?.restaurant;
    if (!restId) return;

    // Initialize draft with my current items in group
    const myCurrent = activeGroup?.participants?.find(
      p => p.user === user?._id || p.user?._id === user?._id || p.name === user?.name
    );
    if (myCurrent?.items) {
      setParticipantItemsDraft(myCurrent.items.map(i => ({
        foodItem: i.foodItem?._id || i.foodItem,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })));
    } else {
      setParticipantItemsDraft([]);
    }

    setMenuModalOpen(true);
    setLoadingMenu(true);
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${restId}/menu`);
      const data = await res.json();
      if (data.success && data.data?.menuItems) {
        setRestaurantMenu(data.data.menuItems);
      } else {
        alert(data.message || 'Failed to load menu');
      }
    } catch (err) {
      console.error('Failed to load menu for group:', err);
      alert('Could not load restaurant menu.');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleUpdateDraftQty = (item, delta) => {
    setParticipantItemsDraft(prev => {
      const existing = prev.find(i => (i.foodItem?._id || i.foodItem) === (item._id || item.foodItem));
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        return prev.filter(i => (i.foodItem?._id || i.foodItem) !== (item._id || item.foodItem));
      }

      if (existing) {
        return prev.map(i =>
          (i.foodItem?._id || i.foodItem) === (item._id || item.foodItem)
            ? { ...i, quantity: newQty }
            : i
        );
      } else {
        return [...prev, {
          foodItem: item._id,
          name: item.name,
          price: item.price,
          quantity: newQty
        }];
      }
    });
  };

  const handleSaveDishesToGroup = async () => {
    setSavingDishes(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const payload = {
        items: participantItemsDraft.map(it => ({
          foodItem: it.foodItem?._id || it.foodItem,
          quantity: it.quantity
        }))
      };

      const res = await fetch(`http://localhost:5000/api/orders/group/${activeGroup.groupCode}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setToastMessage('Your dishes were updated in the group order!');
        setTimeout(() => setToastMessage(null), 3000);
        setMenuModalOpen(false);

        // Refresh group state
        const refreshRes = await fetch(`http://localhost:5000/api/orders/group/${activeGroup.groupCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.group) {
          setActiveGroup(refreshData.data.group);
          localStorage.setItem('foodie_active_group', JSON.stringify(refreshData.data.group));
        }
      } else {
        alert(data.message || 'Failed to update items.');
      }
    } catch (err) {
      console.error('Failed to submit items:', err);
      alert('Error saving dishes to group.');
    } finally {
      setSavingDishes(false);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Do you want to switch or leave this active group?')) {
      localStorage.removeItem('foodie_active_group');
      setActiveGroup(null);
    }
  };

  // Host: Create New Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/group-order');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch('http://localhost:5000/api/orders/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurantId,
          durationMinutes: 45
        })
      });
      const data = await res.json();

      if (data.success && data.data?.group) {
        setActiveGroup(data.data.group);
        setToastMessage(`Group created! Share code #${data.data.group.groupCode} with friends.`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setError(data.message || 'Failed to start group order.');
      }
    } catch (err) {
      console.error('Group create error:', err);
      setError('Connection failure while creating group.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Join without needing code input
  const handleDirectJoin = async (targetCode) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/group-order/${targetCode}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('foodie_token');
      const cleanCode = targetCode.trim().toUpperCase();
      const res = await fetch(`http://localhost:5000/api/orders/group/${cleanCode}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success && data.data?.group) {
        setActiveGroup(data.data.group);
        localStorage.setItem('foodie_active_group', JSON.stringify(data.data.group));
        setToastMessage(`Joined group #${cleanCode}!`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setError(data.message || 'Unable to join group.');
      }
    } catch (err) {
      console.error('Group join error:', err);
      setError('Connection failure while joining group.');
    } finally {
      setLoading(false);
    }
  };

  // Member: Join existing group by code
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    await handleDirectJoin(joinCodeInput);
  };

  // Host: Checkout Group Order
  const handleGroupCheckout = async () => {
    if (!street.trim() || !city.trim()) {
      alert('Please provide street address and city for group delivery.');
      return;
    }

    setCheckingOut(true);
    try {
      const token = localStorage.getItem('foodie_token');
      const res = await fetch(`http://localhost:5000/api/orders/group/${activeGroup.groupCode}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryAddress: { street: street.trim(), city: city.trim(), state: 'Central', postalCode: '400001' },
          deliveryNotes: 'Group order payment collected at doorstep by host.'
        })
      });
      const data = await res.json();

      if (data.success && data.data?.order) {
        navigate(`/order-tracking/${data.data.order._id}`, {
          state: { orderPlaced: true }
        });
      } else {
        alert(data.message || 'Failed to checkout group order.');
      }
    } catch (err) {
      console.error('Group checkout error:', err);
      alert('Error during group checkout.');
    } finally {
      setCheckingOut(false);
    }
  };

  const copyShareCode = () => {
    if (activeGroup?.groupCode) {
      navigator.clipboard.writeText(activeGroup.groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
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

        {error && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorBanner message={error} />
          </div>
        )}

        {/* ACTIVE GROUP ORDER VIEW */}
        {activeGroup ? (
          <div>
            <div className="card" style={{ padding: '32px', marginBottom: '28px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--deep-navy)', margin: 0 }}>
                      Group Order #{activeGroup.groupCode}
                    </h1>
                    <span className="badge badge-cod">COD Single Checkout</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Kitchen: <strong>{activeGroup.restaurant?.name || 'Selected Restaurant'}</strong> • Status: {activeGroup.status}
                  </p>
                </div>

                {/* Shareable Group Code Box & Leave Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-teal-light)',
                    color: 'var(--primary-teal)',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    letterSpacing: '1px'
                  }}>
                    {activeGroup.groupCode}
                  </div>
                  <button
                    onClick={copyShareCode}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Copy size={14} />
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/group-order/${activeGroup.groupCode}`;
                      navigator.clipboard.writeText(link);
                      setToastMessage('Invite link copied! Friends can click it to join instantly without typing code.');
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-teal)' }}
                  >
                    <Share2 size={14} />
                    <span>Copy Invite Link</span>
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    title="Leave or Switch Group"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--danger-red)',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <LogOut size={14} /> Leave
                  </button>
                </div>
              </div>

              {/* Participants & Shared Bill Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', paddingTop: '24px' }}>
                {/* Left: Participant Breakdown */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '14px' }}>
                    Participants ({activeGroup.participants?.length || 0})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeGroup.participants?.map((p, idx) => (
                      <div key={idx} style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--deep-navy)' }}>
                            {p.name} {p.user === activeGroup.creator || p.user?._id === activeGroup.creator ? '(Host)' : ''}
                          </strong>
                          <span style={{ fontWeight: 800, color: 'var(--primary-teal)' }}>
                            ₹{p.participantSubtotal}
                          </span>
                        </div>
                        {p.items?.length > 0 ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {p.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Selecting dishes...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={openMenuModal}
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={15} /> Select & Add My Dishes
                    </button>
                    <Link
                      to={`/restaurant/${activeGroup.restaurant?._id || activeGroup.restaurant}`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Utensils size={14} /> Full Menu View
                    </Link>
                  </div>
                </div>

                {/* Right: Consolidated COD Bill & Checkout */}
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '14px' }}>
                    Group Bill Total
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Combined Items Subtotal</span>
                      <span style={{ fontWeight: 700, color: 'var(--deep-navy)' }}>₹{activeGroup.groupSubtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Single Delivery Fee</span>
                      <span style={{ fontWeight: 700, color: 'var(--deep-navy)' }}>
                        {activeGroup.deliveryFee === 0 ? <strong style={{ color: 'var(--cod-green)' }}>FREE</strong> : `₹${activeGroup.deliveryFee || 40}`}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--deep-navy)' }}>Total Cash at Doorstep</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                        ₹{activeGroup.totalAmount?.toFixed(2) || activeGroup.groupSubtotal}
                      </span>
                    </div>
                  </div>

                  {/* Checkout inputs for Host */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)' }}>
                      Host Doorstep Delivery Street
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10 Tech Park Reception"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.88rem'
                      }}
                    />

                    <button
                      onClick={handleGroupCheckout}
                      disabled={checkingOut || activeGroup.groupSubtotal === 0}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Banknote size={16} />
                      <span>{checkingOut ? 'Submitting Group Order...' : 'Host: Finalize & Place COD Order'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CREATE OR JOIN HUB VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            
            {/* Box 1: Host a Group */}
            <div className="card" style={{ padding: '32px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-teal-light)',
                color: 'var(--primary-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Plus size={24} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                Start a New Group Order
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Pick a kitchen for your family or office team. You will get a shareable code where each member adds their own meal. Single COD checkout handled at doorstep.
              </p>

              <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Choose Restaurant
                  </label>
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    {restaurants.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.address?.city})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}
                >
                  {loading ? 'Creating Group...' : 'Create Order Group & Get Code'}
                </button>
              </form>
            </div>

            {/* Box 2: Join Existing Group */}
            <div className="card" style={{ padding: '32px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--fresh-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Users size={24} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '8px' }}>
                Join an Existing Group
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Got a 6-character code from a coworker or friend? Enter it below to pick your dish from their selected restaurant basket.
              </p>

              <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--deep-navy)', display: 'block', marginBottom: '6px' }}>
                    Enter Group Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRP-4829-1234"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.trim().toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !joinCodeInput.trim()}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    marginTop: '8px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {loading ? 'Joining...' : 'Join Group Meal'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* IN-PAGE DISH SELECTION MODAL */}
        {menuModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
                    Select Your Dishes
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {activeGroup?.restaurant?.name || 'Restaurant'} • Group #{activeGroup?.groupCode}
                  </p>
                </div>
                <button
                  onClick={() => setMenuModalOpen(false)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--deep-navy)'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Menu List */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingMenu ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading fresh restaurant menu...
                  </div>
                ) : restaurantMenu.length === 0 ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No dishes currently available for this kitchen.
                  </div>
                ) : (
                  restaurantMenu.map(dish => {
                    const draftEntry = participantItemsDraft.find(i => (i.foodItem?._id || i.foodItem) === dish._id);
                    const qty = draftEntry ? draftEntry.quantity : 0;

                    return (
                      <div
                        key={dish._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '2px',
                              backgroundColor: dish.isVegetarian ? '#16a34a' : '#dc2626',
                              display: 'inline-block'
                            }} />
                            <strong style={{ fontSize: '0.94rem', color: 'var(--deep-navy)' }}>
                              {dish.name}
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--primary-teal)', fontWeight: 700, marginTop: '2px' }}>
                            ₹{dish.price}
                          </div>
                          {dish.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineClamp: 1, overflow: 'hidden' }}>
                              {dish.description}
                            </div>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        {qty > 0 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--primary-teal-light)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--primary-teal)'
                          }}>
                            <button
                              onClick={() => handleUpdateDraftQty(dish, -1)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Minus size={14} color="var(--deep-navy)" />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--deep-navy)', minWidth: '16px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => handleUpdateDraftQty(dish, 1)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Plus size={14} color="var(--primary-teal)" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpdateDraftQty(dish, 1)}
                            disabled={!dish.isAvailable}
                            style={{
                              border: '1px solid var(--primary-teal)',
                              backgroundColor: '#ffffff',
                              color: 'var(--primary-teal)',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>My Portion Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-teal)' }}>
                    ₹{participantItemsDraft.reduce((sum, it) => sum + (it.price * it.quantity), 0)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setMenuModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDishesToGroup}
                    disabled={savingDishes}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {savingDishes ? 'Updating...' : 'Save Dishes to Group'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default GroupOrder;
