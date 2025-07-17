import React, { useState, useEffect, useCallback } from 'react';
import { patchCart } from '../merchi_public_custom';
import CartItems from './CartItems';
import CartTotals from './CartTotals';

import { ensureWooNonce, fetchWooNonce, updateWooNonce } from '../utils';

// read cart from local storage
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

  useEffect(() => {
    const onStorage = e =>
      e.key === 'MerchiCart' && setCart(readCart());
    window.addEventListener('storage', onStorage);

    // sync with the backend
    (async () => {
      try {
        const patched = await patchCart(readCart(), cart.cartEmbed, { includeShippingFields: false });
        // update the cart in local storage
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

  const findWooKeyBySku = (sku) => {
    const store = JSON.parse(localStorage.storeApiCartData || '{}');
    return (store.items || []).find((i) => String(i.sku) === String(sku))?.key;
  };

  const handleRemove = useCallback(async (item) => {
    const wooKey = findWooKeyBySku(item.product?.id);
    if (!wooKey) {
      console.warn('Missing Woo item key, cannot sync mini-cart');
      return;
    }

    // get current valid nonce
    const nonce = await ensureWooNonce();

    // send request to WooCommerce
    async function postRemove(n) {
      return fetch('/wp-json/wc/store/v1/cart/remove-item', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Nonce': n },
        body: JSON.stringify({ key: wooKey }),
      });
    }

    let res = await postRemove(nonce);
    if (res.status === 403) {
      const fresh = await fetchWooNonce();
      res = await postRemove(fresh);
    }
    if (!res.ok) {
      console.warn('[Cart] Woo remove-item error:', res.status);
      return;
    }

    updateWooNonce(res);

    const wooCart = await res.json();
    localStorage.storeApiCartData = JSON.stringify(wooCart);

    const updatedItems = cart.cartItems.filter(
      ci => String(ci.product?.id) !== String(item.product?.id)
    );

    const subtotalCost = updatedItems.reduce(
      (sum, i) =>
        sum +
        (i.subtotalCost !== undefined
          ? i.subtotalCost
          : (i.cost ?? 0) * (i.quantity ?? 1)
        ),
      0
    );

    const totalCost = updatedItems.reduce(
      (sum, i) =>
        sum +
        (i.totalCost !== undefined ? i.totalCost : (i.subtotalCost ?? i.cost ?? 0) * (i.quantity ?? 1)),
      0
    );
    const updatedCart = {
      ...cart,
      cartItems: updatedItems,
      cartItemsSubtotalCost: subtotalCost,
      cartItemsTotalCost: totalCost,
    };

    localStorage.setItem('MerchiCart', JSON.stringify(updatedCart));
    setCart(updatedCart);

    patchCart(updatedCart, cart.cartEmbed, { includeShippingFields: false }).catch(e =>
      console.warn('[Cart] patchCart error:', e?.response?.status || e)
    );
  }, [cart]);


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
