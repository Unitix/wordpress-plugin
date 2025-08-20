import React, { useState, useEffect, useCallback } from 'react';
import { patchCart } from '../merchi_public_custom';
import CartItems from './CartItems';
import CartTotals from './CartTotals';
import { ensureWooNonce, fetchWooNonce, updateWooNonce, getWpApiRoot } from '../utils';

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
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const apiRoot = getWpApiRoot();

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

  console.log('-----WoocommerceCartForm------');
  console.log('scriptData', window.scriptData.wooCartData);

  const handleRemove = useCallback(async (item, idx, wooKeyFromRow) => {
    console.log('-----handleRemove------');
    console.log('item', item);
    console.log('idx', idx);
    console.log('wooKeyFromRow', wooKeyFromRow);
    const wooKey = wooKeyFromRow || findWooKey(item);
    console.log('wooKey', wooKey);
    if (!wooKey) {
      console.warn('Missing Woo item key, cannot sync mini-cart');
      return;
    }
    console.log('we have wooKey, start removing');

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
      console.warn('[Cart] Woo remove-item error:', res.status);
      return;
    }

    updateWooNonce(res);

    const wooCart = await res.json();
    localStorage.storeApiCartData = JSON.stringify(wooCart);

    const updatedItems = cart.cartItems.filter((_, i) => i !== idx);

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

    const taxAmount = Math.max(0, totalCost - subtotalCost);

    const updatedCart = {
      ...cart,
      cartItems: updatedItems,
      cartItemsSubtotalCost: subtotalCost,
      cartItemsTotalCost: totalCost,
      cartItemsTaxAmount: taxAmount,
      subtotalCost,
      taxAmount,
      totalCost,
    };

    localStorage.setItem('MerchiCart', JSON.stringify(updatedCart));
    setCart(updatedCart);

    patchCart(updatedCart, cart.cartEmbed, { includeShippingFields: true, preserveShippingInLocalStorage: false }).catch(e =>
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

  const shopUrl = window.scriptData?.shopUrl || '/shop';

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
            <CartItems cartItems={cart.cartItems} onRemove={handleRemove} />
            <CartTotals cart={cart} />
          </div>
        </div>
      </div>
    </main>
  );
} 
