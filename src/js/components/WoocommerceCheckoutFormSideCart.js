import React, { useState, useEffect, useRef } from 'react'
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

export default function WoocommerceCheckoutFormSideCart({ cart, loading, isUpdatingShipping, allowRemoveCoupon = true }) {
  const [localCart, setLocalCart] = useState(readCart());

  const [couponData, setCouponData] = useState({
    totals: null,
    appliedCodes: []
  });
  const couponPanelRef = useRef(null);

  const cartReady =
    (cart?.cartItems?.length) ||
    (localCart.cartItems?.length);

  useEffect(() => {
    const onStorage = (e) =>
      e.key === 'MerchiCart' && setLocalCart(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleTotalsChange = (data) => setCouponData(data);

  const handleRemoveCoupon = (idx) => {
    if (
      couponPanelRef.current &&
      typeof couponPanelRef.current.removeDiscountCode === 'function'
    ) {
      couponPanelRef.current.removeDiscountCode(idx);
    }
  };

  const showCart = cart?.cartItems?.length && cart.cartItems[0].product?.name ? cart : localCart;

  const subtotal = showCart.cartItemsSubtotalCost ?? 0;
  const tax = showCart.taxAmount ?? 0;
  const shipping = showCart.shipmentTotalCost ?? 0;
  const selectedQuote =
    showCart.shipmentGroups?.find(g => g.selectedQuote)?.selectedQuote ?? null;

  const displayDiscount = Math.abs(
    couponData.totals?.discount ??
    (Array.isArray(showCart.discountItems)
      ? showCart.discountItems.reduce((s, i) => s + (Number(i.cost) || 0), 0)
      : 0)
  );

  const displayTotal = subtotal + tax + shipping - displayDiscount;

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
          {allowRemoveCoupon && (
            <CouponPanel
              ref={couponPanelRef}
              onTotalsChange={handleTotalsChange}
            />
          )}
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

            {(displayDiscount > 0 || couponData.appliedCodes.length > 0) && (
              <div className="wp-block-woocommerce-checkout-order-summary-discount-block wc-block-components-totals-wrapper">
                <div className="wc-block-components-totals-item wc-block-components-totals-discount">
                  <span className="wc-block-components-totals-item__label">
                    Discount
                  </span>
                  <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">
                    -${displayDiscount.toFixed(2)}
                  </span>

                  {/* applied coupon list */}
                  {allowRemoveCoupon && couponData.appliedCodes.length > 0 && (
                    <div className="wc-block-components-totals-item__description">
                      <ul className="wc-block-components-totals-discount__coupon-list">
                        {couponData.appliedCodes.map((c, idx) => (
                          <li
                            key={idx}
                            className="wc-block-components-totals-discount__coupon-list-item is-removable wc-block-components-chip wc-block-components-chip--radius-large"
                          >
                            <span
                              aria-hidden="true"
                              className="wc-block-components-chip__text"
                            >
                              {c.code}
                            </span>
                            <span className="screen-reader-text">
                              Coupon: {c.code}
                            </span>
                            <button
                              className="wc-block-components-chip__remove"
                              aria-label={`Remove coupon "${c.code}"`}
                              onClick={() => handleRemoveCoupon(idx)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                role="img"
                                className="wc-block-components-chip__remove-icon"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    `$${displayTotal.toFixed(2)}`
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
