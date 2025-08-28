import React, { useState, useEffect, useCallback } from 'react';
// import { patchCart } from '../merchi_public_custom';
import CartItems from './CartItems';
import CartTotals from './CartTotals';
import { ensureWooNonce, fetchWooNonce, updateWooNonce, getWpApiRoot } from '../utils';
import { useCart } from '../contexts/CartContext'

export default function WoocommerceCartForm() {
  const {
    cart,
    loading,
    isUpdating,
    initializeCart,
    updateCart,
    refreshCart,
  } = useCart();

  const [firstPaintDone, setFirstPaintDone] = useState(false);
  const apiRoot = getWpApiRoot();

  useEffect(() => {
    if (!firstPaintDone && !loading) setFirstPaintDone(true);
  }, [loading, firstPaintDone]);

  const getWooCartList = () => {
    const sd = window.scriptData || {};
    return sd.wooCartDat || sd.wooCartData || [];
  };

  const findWooKey = (item) => {
    const list = getWooCartList();
    const merchiId = item?.merchi_cart_item_id;
    if (merchiId != null) {
      const found = list.find((row) => String(row.merchi_cart_item_id) === String(merchiId));
      if (found && found.key) return found.key;
    }
    return undefined;
  };

  const handleRemove = useCallback(async (item, idx, wooKeyFromRow) => {
    const wooKey = wooKeyFromRow || findWooKey(item);
    if (!wooKey) {
      console.warn('Missing Woo item key, cannot sync mini-cart');
      return;
    }

    // get current valid nonce
    const nonce = await ensureWooNonce();

    // send request to WooCommerce
    async function postRemove(n) {
      return fetch(`${apiRoot}wc/store/v1/cart/remove-item`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WC-Store-API-Nonce': n,
          'Nonce': n,
        },
        body: JSON.stringify({ key: wooKey }),
      });
    }

    let res = await postRemove(nonce);
    if (res.status === 403) {
      const fresh = await fetchWooNonce();
      res = await postRemove(fresh);
    }
    if (!res.ok) {
      console.error('[Cart] Woo remove-item error:', res.status, res.statusText);
      return;
    }

    updateWooNonce(res);
    await res.json()

    // sync the merchicart
    try {
      if (!cart?.id || !cart?.token) {
        await initializeCart();
      }
      const merchiItemId = item?.id ?? item?.merchi_cart_item_id;
      const nextItems = cart.cartItems.filter((ci, i) =>
        merchiItemId != null ? ci?.id !== merchiItemId : i !== idx
      );

      if (nextItems.length === cart.cartItems.length) {
        await refreshCart();
        return;
      }
      const nextCartJson = {
        ...cart,
        cartItems: nextItems,
      };

      await updateCart(
        nextCartJson,
        cart?.cartEmbed,
        {
          includeShippingFields: false,
          preserveShippingInLocalStorage: true,
        }
      );

      if (window?.jQuery?.fn) {
        window.jQuery(document.body).trigger("wc_fragment_refresh");
      }
    } catch (e) {
      console.warn('[Cart] updateCart remove failed, fallback to refresh:', e?.message || e);
      await refreshCart();
    }
  },
    [apiRoot, cart?.id, cart?.cartItems, cart?.cartEmbed, updateCart, refreshCart]
  );

  if (loading && !firstPaintDone) {
    return (
      <div className="wc-cart-loading" role="status">
        <div className="wc-block-components-spinner is-active"></div>
      </div>
    );
  }

  const shopUrl = window.scriptData?.shopUrl || '/shop';

  if (!cart.cartItems?.length) {
    return (
      <main
        id="wp--skip-link--target"
        className="wp-block-group has-global-padding is-layout-constrained wp-block-group-is-layout-constrained"
      >
        <div className="entry-content alignwide wp-block-post-content">
          <div className="wp-block-woocommerce-cart">
            <div className="wp-block-woocommerce-empty-cart-block" style={{ textAlign: 'center' }}>
              <h2 className="wp-block-heading has-text-align-center with-empty-cart-icon wc-block-cart__empty-cart__title" style={{ marginBottom: '2rem' }}>
                Your cart is currently empty!
              </h2>
              <p style={{ textAlign: 'center', marginTop: '3rem' }}>
                <a href={shopUrl} className="wp-element-button">
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
            <CartItems onRemove={handleRemove} />
            <CartTotals />
          </div>
        </div>
      </div>
    </main>
  );
} 
