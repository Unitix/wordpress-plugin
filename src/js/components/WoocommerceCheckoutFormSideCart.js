import React, { useState, useEffect } from 'react'
import CouponPanel from './CouponPanel';
import VariationGroupsDisplay from './VariationGroupsDisplay';

const readCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem('MerchiCart')) || {};
    return data.cart ?? data;
  } catch {
    return {};
  }
};

export default function WoocommerceCheckoutFormSideCart({ cart, loading, isUpdatingShipping }) {
  const [localCart, setLocalCart] = useState(readCart());

  const cartReady =
    (cart?.cartItems?.length && cart.cartItems[0].product?.name) ||
    (localCart.cartItems?.length && localCart.cartItems[0].product?.name);

  useEffect(() => {
    const onStorage = (e) =>
      e.key === 'MerchiCart' && setLocalCart(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const showCart = cart?.cartItems?.length && cart.cartItems[0].product?.name ? cart : localCart;

  const subtotal = showCart.cartItemsSubtotalCost ?? 0;
  const total = showCart.totalCost ?? 0;
  const tax = showCart.taxAmount ?? 0;
  const shipping = showCart.shipmentTotalCost ?? 0;
  const selectedQuote =
    showCart.shipmentGroups?.find(g => g.selectedQuote)?.selectedQuote ?? null;

  if (!cartReady) {
    return (
      <div className='wc-block-components-sidebar wc-block-checkout__sidebar wp-block-woocommerce-checkout-totals-block is-sticky is-large'>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="wc-block-components-spinner is-active"></div>
        </div>
      </div>
    );
  }

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
                {(showCart.cartItems || []).map((item, index) => {
                  const { product = {}, quantity = 1, totalCost = 0 } = item;
                  const thumb =
                    product.featureImage?.viewUrl ||
                    product.images?.[0]?.viewUrl ||
                    'https://woocommerce.com/wp-content/plugins/woocommerce/assets/images/placeholder.png';
                  const lineTotal = item.totalCost ?? 0;

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
                        <div className="wc-block-components-product-metadata">
                          <div className="wc-block-components-product-details">
                            <div className="wc-block-components-product-details__test-field">
                              <VariationGroupsDisplay
                                product={product}
                                variationsGroups={item.variationsGroups}
                              />
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
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">${subtotal.toFixed(2)}</span>
                <div className="wc-block-components-totals-item__description"></div>
              </div>
            </div>

            <div className="wp-block-woocommerce-checkout-order-summary-tax-block wc-block-components-totals-wrapper">
              <div className="wc-block-components-totals-item">
                <span className="wc-block-components-totals-item__label">
                  Tax
                </span>
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">
                  ${tax.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="wp-block-woocommerce-checkout-order-summary-fee-block wc-block-components-totals-wrapper"></div>
            <div className="wp-block-woocommerce-checkout-order-summary-discount-block wc-block-components-totals-wrapper"></div>
            {shipping > 0 && (
              <div className="wp-block-woocommerce-checkout-order-summary-shipping-block wc-block-components-totals-wrapper">
                <div className="wc-block-components-totals-shipping">
                  <div className="wc-block-components-totals-item">
                    <span className="wc-block-components-totals-item__label">Delivery</span>
                    <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">
                      {isUpdatingShipping ? (
                        <span style={{
                          display: 'inline-block',
                          width: '1em',
                          height: '1em',
                          position: 'relative',
                          verticalAlign: 'middle'
                        }}>
                          <span
                            className="wc-block-components-spinner is-active"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              transform: 'scale(0.6)',
                              transformOrigin: 'top left'
                            }}
                          />
                        </span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                    <div className="wc-block-components-totals-item__description">
                      {selectedQuote && (
                        <div className="wc-block-components-totals-shipping__via">
                          {selectedQuote.name}
                        </div>
                      )}
                      <div className="wc-block-components-shipping-address"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item wc-block-components-totals-footer-item">
              <span className="wc-block-components-totals-item__label">Total</span>
              <div className="wc-block-components-totals-item__value">
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-footer-item-tax-value">
                  {isUpdatingShipping ? (
                    <span style={{
                      display: 'inline-block',
                      width: '1em',
                      height: '1em',
                      position: 'relative',
                      verticalAlign: 'middle'
                    }}>
                      <span
                        className="wc-block-components-spinner is-active"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transform: 'scale(0.6)',
                          transformOrigin: 'top left'
                        }}
                      />
                    </span>
                  ) : (
                    `$${total.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="wc-block-components-totals-item__description"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
