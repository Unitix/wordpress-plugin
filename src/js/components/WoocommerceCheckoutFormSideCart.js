import React from 'react';
import CouponPanel from './CouponPanel';

export default function WoocommerceCheckoutFormSideCart() {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Cpath d="M65,45 L65,40 L60,40 L60,35 L40,35 L40,40 L35,40 L35,65 L65,65 L65,45 Z M60,45 L60,60 L40,60 L40,45 L45,45 L45,40 L55,40 L55,45 L60,45 Z" fill="%23888888"/%3E%3C/svg%3E';
  };

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
                <div className="wc-block-components-order-summary-item">
                  <div className="wc-block-components-order-summary-item__image">
                    <div className="wc-block-components-order-summary-item__quantity">
                      <span aria-hidden="true">20</span>
                      <span className="screen-reader-text">20 items</span>
                    </div>
                    <img
                      src="http://localhost:3002/wp-content/uploads/2025/05/419157-300x300.jpeg"
                      alt="Duffle Bag &#8211; 7th May 2024"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="wc-block-components-order-summary-item__description">
                    <h3 className="wc-block-components-product-name">Duffle Bag – 7th May 2024</h3>
                    <span className="wc-block-components-order-summary-item__individual-prices price wc-block-components-product-price">
                      <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value wc-block-components-order-summary-item__individual-price">$8.80</span>
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
                  <span className="screen-reader-text">Total price for 20 Duffle Bag &#8211; 7th May 2024 items: $176.00</span>
                  <div className="wc-block-components-order-summary-item__total-price" aria-hidden="true">
                    <span className="price wc-block-components-product-price">
                      <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">$176.00</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CouponPanel />
          <div data-block-name="woocommerce/checkout-order-summary-totals-block" className="wp-block-woocommerce-checkout-order-summary-totals-block">
            <div className="wp-block-woocommerce-checkout-order-summary-subtotal-block wc-block-components-totals-wrapper">
              <div className="wc-block-components-totals-item">
                <span className="wc-block-components-totals-item__label">Subtotal</span>
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">$176.00</span>
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
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-footer-item-tax-value">$176.00</span>
              </div>
              <div className="wc-block-components-totals-item__description"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
