import React, { useState, useEffect } from 'react'
import CouponPanel from './CouponPanel';
import { patchCart } from '../merchi_public_custom';

const readCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem('MerchiCart')) || {};
    return data.cart ?? data;
  } catch {
    return {};
  }
};

export default function WoocommerceCheckoutFormSideCart() {
  const [cart, setCart] = useState(readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onStorage = (e) =>
      e.key === 'MerchiCart' && setCart(readCart());
    window.addEventListener('storage', onStorage);

    (async () => {
      try {
        const patched = await patchCart(readCart());
        setCart(JSON.parse(localStorage.getItem('MerchiCart')) || patched);
      } catch (err) {
        console.warn('[Checkout] patchCart error:', err?.response?.status || err);
      } finally {
        setLoading(false);
      }
    })();

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) {
    return (
      <div className="wc-block-components-spinner is-active" role="status">
        <span className="screen-reader-text">Loading order…</span>
      </div>
    );
  }

  const subtotal =
    cart.cartItemsSubtotalCost ??
    cart.cartItems.reduce(
      (sum, i) =>
        sum + (i.subtotalCost ?? (i.cost ?? 0) * i.quantity),
      0
    );
  const total =
    cart.cartItemsTotalCost ??
    cart.cartItems.reduce(
      (sum, i) => sum + (i.totalCost ?? 0),
      0
    );

  return (
    <div className='wc-block-components-sidebar wc-block-checkout__sidebar wp-block-woocommerce-checkout-totals-block is-sticky is-large'>
      <div className="wp-block-woocommerce-checkout-order-summary-block">
        <div className="wc-block-components-checkout-order-summary__title">
          <p className="wc-block-components-checkout-order-summary__title-text" role="heading">Order summary</p>
        </div>
        <div className="wc-block-components-checkout-order-summary__content" id=":r4:">
          <div className="wp-block-woocommerce-checkout-order-summary-cart-items-block wc-block-components-totals-wrapper">
            <div className="wc-block-components-order-summary is-large">
              <div className="wc-block-components-order-summary__content">
                {cart.cartItems.map((item, index) => {
                  const { product = {}, quantity = 1, totalCost = 0 } = item;
                  const thumb =
                    product.featureImage?.viewUrl ||
                    product.previewImageUrl ||
                    product.image ||
                    'https://woocommerce.com/wp-content/plugins/woocommerce/assets/images/placeholder.png';
                  const unitPrice = totalCost;
                  const lineTotal = totalCost * quantity;

                  return (
                    <div
                      key={`${product.id}-${index}`}
                      className="wc-block-components-order-summary-item"
                    >
                      <div className="wc-block-components-order-summary-item__image">
                        <div className="wc-block-components-order-summary-item__quantity">
                          <span aria-hidden="true">{quantity}</span>
                          <span className="screen-reader-text">
                            {quantity} items
                          </span>
                        </div>
                        <img
                          src={thumb}
                          alt={product.name || 'Product'}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <div className="wc-block-components-order-summary-item__description">
                        <h3 className="wc-block-components-product-name"> {product.name || 'Product'}</h3>
                        <span className="wc-block-components-order-summary-item__individual-prices price wc-block-components-product-price">
                          <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value wc-block-components-order-summary-item__individual-price">${unitPrice}</span>
                        </span>
                        <div className="wc-block-components-product-metadata">
                          <div className="wc-block-components-product-details">
                            <div className="wc-block-components-product-details__test-field">
                              <span className="wc-block-components-product-details__name">Test Field:</span>
                              <span className="wc-block-components-product-details__value">Test Value</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="screen-reader-text"> Total price for {quantity} {product.name} items: $
                        {lineTotal}</span>
                      <div className="wc-block-components-order-summary-item__total-price" aria-hidden="true">
                        <span className="price wc-block-components-product-price">
                          <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">${lineTotal}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <CouponPanel />
          <div data-block-name="woocommerce/checkout-order-summary-totals-block" className="wp-block-woocommerce-checkout-order-summary-totals-block">
            <div className="wp-block-woocommerce-checkout-order-summary-subtotal-block wc-block-components-totals-wrapper">
              <div className="wc-block-components-totals-item">
                <span className="wc-block-components-totals-item__label">Subtotal</span>
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">${subtotal}</span>
                <div className="wc-block-components-totals-item__description"></div>
              </div>
            </div>

            <div className="wp-block-woocommerce-checkout-order-summary-fee-block wc-block-components-totals-wrapper"></div>
            <div className="wp-block-woocommerce-checkout-order-summary-discount-block wc-block-components-totals-wrapper"></div>
          </div>

          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item wc-block-components-totals-footer-item">
              <span className="wc-block-components-totals-item__label">Total</span>
              <div className="wc-block-components-totals-item__value">
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-footer-item-tax-value">${total}</span>
              </div>
              <div className="wc-block-components-totals-item__description"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
