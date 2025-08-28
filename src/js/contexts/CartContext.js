import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initOrSyncCart, getCart, patchCart } from '../merchi_public_custom';
import { MERCHI_SDK } from '../merchi_sdk';

const CartContext = createContext();

// Helper function to read cart from localStorage
const readCartFromStorage = () => {
  try {
    const data = JSON.parse(localStorage.getItem('MerchiCart')) || {};
    return data.cart ?? data;
  } catch {
    return {};
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(readCartFromStorage());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const MERCHI = MERCHI_SDK();

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, []);

  // Listen for localStorage changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'MerchiCart') {
        setCart(readCartFromStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initializeCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cartEntity = await initOrSyncCart();
      if (cartEntity) {
        const cartJson = MERCHI.toJson(cartEntity);
        setCart(cartJson);
        localStorage.setItem('MerchiCart', JSON.stringify(cartJson));
      } else {
        // If cart initialization fails, use what's in localStorage
        setCart(readCartFromStorage());
      }
    } catch (err) {
      console.error('Cart initialization failed:', err);
      setError('Failed to load cart');
      // Fallback to localStorage data
      setCart(readCartFromStorage());
    } finally {
      setLoading(false);
    }
  }, [MERCHI]);

  const refreshCart = useCallback(async () => {
    const currentCart = readCartFromStorage();
    if (!currentCart?.id || !currentCart?.token) {
      return initializeCart();
    }

    setIsUpdating(true);
    setError(null);

    try {
      const cartEntity = await getCart(currentCart.id, currentCart.token);
      const cartJson = MERCHI.toJson(cartEntity);
      setCart(cartJson);
      localStorage.setItem('MerchiCart', JSON.stringify(cartJson));
    } catch (err) {
      console.error('Cart refresh failed:', err);
      setError('Failed to refresh cart');
    } finally {
      setIsUpdating(false);
    }
  }, [MERCHI]);

  const updateCart = useCallback(async (cartData, embed, options = {}) => {
    setIsUpdating(true);
    setError(null);

    try {
      const cartEntity = await patchCart(cartData, embed, options);
      const cartJson = MERCHI.toJson(cartEntity);
      setCart(cartJson);
      localStorage.setItem('MerchiCart', JSON.stringify(cartJson));
      return cartEntity;
    } catch (err) {
      console.error('Cart update failed:', err);
      setError('Failed to update cart');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [MERCHI]);

  const clearCart = useCallback(() => {
    setCart({});
    localStorage.removeItem('MerchiCart');
    setError(null);
  }, []);

  // Computed values
  const cartItems = cart?.cartItems || [];
  const cartItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cart?.cartItemsSubtotalCost || 0;
  const totalCost = cart?.totalCost || 0;
  const taxAmount = cart?.taxAmount || 0;
  const isEmpty = cartItems.length === 0;

  const contextValue = {
    // Cart data
    cart,
    cartItems,
    cartItemsCount,
    subtotal,
    totalCost,
    taxAmount,
    isEmpty,

    // Loading states
    loading,
    isUpdating,
    error,

    // Actions
    refreshCart,
    updateCart,
    clearCart,
    initializeCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
