import React from 'react';

export default function WoocommerceCheckoutFormSideCart() {
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
                    <img src="http://localhost:3002/wp-content/uploads/2025/05/419157-300x300.jpeg" alt="Duffle Bag &#8211; 7th May 2024" />
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

          <div className="wp-block-woocommerce-checkout-order-summary-coupon-form-block wc-block-components-totals-wrapper">
            <div role="heading" aria-level="2" className="wc-block-components-totals-coupon wc-block-components-panel">
              <div aria-expanded="false" className="wc-block-components-panel__button" tabIndex="0" role="button">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" className="wc-block-components-panel__button-icon" focusable="false">
                  <path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path>
                </svg>
                Add a coupon
              </div>
            </div>
          </div>

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
