import React, { useState, useEffect } from 'react';
import CartItems from './CartItems';
import CartTotals from './CartTotals';

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem('MerchiCart')) || {};
  } catch {
    return {};
  }
};

export default function WoocommerceCartForm() {
  const [cart, setCart] = useState(readCart());

  useEffect(() => {
    const onStorage = e => e.key === 'MerchiCart' && setCart(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!cart.cartItems?.length) {
    return (
      <div className="wc-block-cart">
        <p>Your cart is currently empty.</p>
        <a href="/shop" className="wp-element-button">Return to shop</a>
      </div>
    );
  }

  return (
    <div className="wc-block-components-sidebar-layout wc-block-cart wp-block-woocommerce-filled-cart-block is-large">
      <CartItems cartItems={cart.cartItems} />
      <CartTotals cart={cart} />
    </div>
  );
}
