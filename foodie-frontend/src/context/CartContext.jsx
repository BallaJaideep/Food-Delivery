import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('foodie_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('foodie_cart_restaurant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('foodie_cart', JSON.stringify(cartItems));
    localStorage.setItem('foodie_cart_restaurant', JSON.stringify(restaurant));
  }, [cartItems, restaurant]);

  const addItem = (item, restInfo) => {
    // Single-restaurant cart validation
    if (restaurant && restaurant._id !== restInfo._id && cartItems.length > 0) {
      const confirmClear = window.confirm(
        `Your cart contains items from "${restaurant.name}". Would you like to clear your cart to add items from "${restInfo.name}"?`
      );
      if (!confirmClear) return false;
      setCartItems([{ ...item, quantity: 1 }]);
      setRestaurant(restInfo);
      return true;
    }

    if (!restaurant) {
      setRestaurant(restInfo);
    }

    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    return true;
  };

  const removeItem = (itemId) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i._id !== itemId);
      if (updated.length === 0) {
        setRestaurant(null);
      }
      return updated;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setCartItems(prev => prev.map(i => i._id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = cartItems.length > 0 ? 40 : 0;
  const platformFee = cartItems.length > 0 ? 15 : 0;
  const grandTotal = subtotal + deliveryFee + platformFee;

  return (
    <CartContext.Provider value={{
      cartItems,
      restaurant,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      deliveryFee,
      platformFee,
      grandTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
