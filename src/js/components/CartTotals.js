import React from 'react';
import CouponPanel from './CouponPanel';

export default function CartTotals({ cart }) {
  const subtotal = +(cart.cartItemsSubtotalCost ?? cart.subtotalCost ?? 0);
  const total = +(cart.cartItemsTotalCost ?? cart.totalCost ?? 0);

  const taxRaw =
    cart.cartItemsTaxAmount ??
    cart.taxAmount ??
    (total > subtotal ? total - subtotal : 0);

  const tax = (+taxRaw).toFixed(2);
  const subtotalFmt = subtotal.toFixed(2);
  const totalFmt = total.toFixed(2);

  return (
    <div className="wc-block-components-sidebar wc-block-cart__sidebar wp-block-woocommerce-cart-totals-block">
      <div className="wp-block-woocommerce-cart-order-summary-block">
        <h2 className="wp-block-woocommerce-cart-order-summary-heading-block wc-block-cart__totals-title">
          Cart totals
        </h2>
        <CouponPanel />
        <div className="wp-block-woocommerce-cart-order-summary-totals-block">
          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item">
              <span className="wc-block-components-totals-item__label">Subtotal</span>
              <span className="wc-block-components-totals-item__value">{`$${subtotalFmt}`}</span>
            </div>
          </div>

          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item">
              <span className="wc-block-components-totals-item__label">Tax</span>
              <span className="wc-block-components-totals-item__value">{`$${tax}`}</span>
            </div>
          </div>

          <div class="wp-block-woocommerce-cart-order-summary-discount-block wc-block-components-totals-wrapper">
            <div class="wc-block-components-totals-item wc-block-components-totals-discount">
              <span class="wc-block-components-totals-item__label">Discount</span>
              <span class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">-$1.00</span>
              <div class="wc-block-components-totals-item__description">
                <div class="">
                  <div class="" aria-hidden="false">
                    <ul class="wc-block-components-totals-discount__coupon-list">
                      <li class="wc-block-components-totals-discount__coupon-list-item is-removable wc-block-components-chip wc-block-components-chip--radius-large">
                        <span aria-hidden="true" class="wc-block-components-chip__text">test123</span>
                        <span class="screen-reader-text">Coupon: test123</span>
                        <button class="wc-block-components-chip__remove" aria-label="Remove coupon &quot;test123&quot;">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" role="img" class="wc-block-components-chip__remove-icon" aria-hidden="true" focusable="false">
                            <path d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z">
                            </path>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item wc-block-components-totals-footer-item">
              <span className="wc-block-components-totals-item__label">Total</span>
              <span className="wc-block-components-totals-item__value">{`$${totalFmt}`}</span>
            </div>
          </div>
        </div>

        <div className="wc-block-cart__submit wp-block-woocommerce-proceed-to-checkout-block">
          <div className="wc-block-cart__submit-container">
            <a
              href="/checkout"
              className="wc-block-components-button wp-element-button wc-block-cart__submit-button contained"
            >
              <span className="wc-block-components-button__text">Proceed to Checkout</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
