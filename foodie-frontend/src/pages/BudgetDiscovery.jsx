import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  Flame,
  Search,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronLeft,
  SlidersHorizontal,
  Leaf,
  Check
} from 'lucide-react';
import { StatusBadge, CardSkeleton, EmptyState } from '../components/primitives';

const QUICK_BUDGETS = [99, 149, 199, 299, 499];

export const BudgetDiscovery = () => {
  const { addItem } = useCart();
  const [budget, setBudget] = useState(199);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBudgetMeals = async (targetBudget) => {
    setLoading(true);
    try {
      const url = `http://localhost:5000/api/food/budget-discovery?budget=${targetBudget}${isVegetarian ? '&isVegetarian=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.meals) {
        setItems(data.data.meals);
      }
    } catch (err) {
      console.error('Budget meals error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetMeals(budget);
  }, [budget, isVegetarian]);

  const handleAddToCart = (item) => {
    if (!item.restaurant) return;
    const success = addItem(item, {
      _id: item.restaurant._id,
      name: item.restaurant.name,
      address: item.restaurant.address
    });
    if (success) {
      setToastMessage(`Added "${item.name}" to cart!`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--bg-app)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/"
            style={{
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--deep-navy)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <ChevronLeft size={16} /> Home
          </Link>
        </div>

        {/* Global Toast */}
        {toastMessage && (
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
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Header */}
        <div className="card" style={{
          padding: '36px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)',
          border: '1px solid var(--primary-teal-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              color: 'var(--primary-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.2)'
            }}>
              <Flame size={30} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ backgroundColor: '#ffffff', color: 'var(--primary-teal)', fontWeight: 800 }}>
                  SMART COD MEAL PLANNER
                </span>
                <span className="badge badge-cod">Strict Cash on Delivery</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--deep-navy)', margin: '4px 0 0', letterSpacing: '-0.5px' }}>
                Budget-Based Meal Discovery
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Set your exact spending ceiling and discover satisfying gourmet meals from top kitchens that fit within your budget note.
          </p>
        </div>

        {/* Budget Filter Controls */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Select Your Budget Ceiling
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {QUICK_BUDGETS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBudget(amt)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-full)',
                      border: budget === amt ? '2px solid var(--primary-teal)' : '1px solid var(--border-medium)',
                      backgroundColor: budget === amt ? 'var(--primary-teal-light)' : '#ffffff',
                      color: budget === amt ? 'var(--primary-teal)' : 'var(--deep-navy)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Under ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsVegetarian(!isVegetarian)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-full)',
                border: isVegetarian ? '1.5px solid #16a34a' : '1px solid var(--border-subtle)',
                backgroundColor: isVegetarian ? 'rgba(22, 163, 74, 0.1)' : '#ffffff',
                color: isVegetarian ? '#15803d' : 'var(--deep-navy)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Leaf size={16} color={isVegetarian ? '#16a34a' : 'var(--text-muted)'} />
              <span>Veg Only</span>
            </button>
          </div>
        </div>

        {/* Meals Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-navy)', margin: 0 }}>
              Meals Under ₹{budget} ({items.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--cod-green)', fontWeight: 700 }}>
              ✓ 100% Cash on Delivery
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              <CardSkeleton height="200px" />
              <CardSkeleton height="200px" />
              <CardSkeleton height="200px" />
            </div>
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                No meals found under ₹{budget}. Try increasing your budget limit.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '22px' }}>
              {items.map((meal) => (
                <div
                  key={meal._id}
                  className="card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Store size={13} /> {meal.restaurant?.name || 'Kitchen'}
                      </span>
                      <span style={{
                        fontSize: '0.74rem',
                        backgroundColor: 'var(--primary-teal-light)',
                        color: 'var(--primary-teal)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        {meal.budgetUtilizationPercent}% of ₹{budget}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-navy)', margin: '0 0 4px' }}>
                      {meal.name}
                    </h3>
                    <p style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      margin: '0 0 14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {meal.description || 'Freshly prepared chef recipe.'}
                    </p>
                  </div>

                  <div style={{ paddingTop: '12px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Price</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--deep-navy)' }}>
                        ₹{meal.price}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(meal)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                    >
                      Add to Feast
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default BudgetDiscovery;
