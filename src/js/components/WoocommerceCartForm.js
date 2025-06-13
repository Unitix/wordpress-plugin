import React, { useState, useEffect } from 'react';
import { patchCart } from '../merchi_public_custom';
import CartItems from './CartItems';
import CartTotals from './CartTotals';

const readCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem('MerchiCart')) || {};
    return data.cart ?? data;
  } catch {
    return {};
  }
};

export default function WoocommerceCartForm() {
  const [cart, setCart] = useState(readCart());
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const onStorage = e => e.key === 'MerchiCart' && setCart(readCart());
  //   window.addEventListener('storage', onStorage);
  //   return () => window.removeEventListener('storage', onStorage);

  // }, []);

  useEffect(() => {
    const onStorage = e =>
      e.key === 'MerchiCart' && setCart(readCart());
    window.addEventListener('storage', onStorage);

    (async () => {
      try {
        const patched = await patchCart(readCart());
        setCart(JSON.parse(localStorage.getItem('MerchiCart')) || patched);
      } catch (e) {
        console.warn('[Cart] patchCart error:', e.response?.status || e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleRemove = (item) => {
    const updatedItems = cart.cartItems.filter(
      ci => ci.product?.id !== item.product?.id
    );

    const subtotalCost = updatedItems.reduce(
      (sum, i) => sum + ((i.subtotalCost ?? i.cost ?? i.totalCost ?? 0) * i.quantity),
      0
    );
    const totalCost = updatedItems.reduce(
      (sum, i) =>
        sum + ((i.totalCost ?? i.subtotalCost ?? i.cost ?? 0) * i.quantity),
      0
    );
    const updated = {
      ...cart,
      cartItems: updatedItems,
      cartItemsSubtotalCost: subtotalCost,
      cartItemsTotalCost: totalCost,
    };
    setCart(updated);
    localStorage.setItem('MerchiCart', JSON.stringify(updated));
    patchCart(updated)
      .then(() => setCart(readCart()))
      .catch(e => console.warn('[Cart] patchCart error:', e.response?.status || e));
  };

  if (loading) {
    return (
      <div className="wc-cart-loading" role="status">
        <div className="wc-block-components-spinner is-active"></div>
      </div>
    );
  }

  if (!cart.cartItems?.length) {
    return (
      <main
        id="wp--skip-link--target"
        className="wp-block-group has-global-padding is-layout-constrained wp-block-group-is-layout-constrained"
      >
        <div className="entry-content alignwide wp-block-post-content">
          <div className="wp-block-woocommerce-cart">
            <div className="wp-block-woocommerce-empty-cart-block">
              <h2 className="wp-block-heading has-text-align-center with-empty-cart-icon wc-block-cart__empty-cart__title">
                Your cart is currently empty!
              </h2>
              <p style={{ textAlign: 'center', marginTop: '3rem' }}>
                <a href="/shop" className="wp-element-button">
                  Return to shop
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="wp--skip-link--target" className="wp-block-group has-global-padding is-layout-constrained wp-block-group-is-layout-constrained">
      <div className="entry-content alignwide wp-block-post-content">
        <div className="wp-block-woocommerce-cart">
          <div className="wc-block-components-notice-snackbar-list" tabIndex="-1" />
          <div className="wc-block-components-sidebar-layout wc-block-cart wp-block-woocommerce-filled-cart-block is-large">
            <CartItems cartItems={cart.cartItems} onRemove={handleRemove} />
            <CartTotals cart={cart} />
          </div>
        </div>
      </div>
    </main>
  );
}
