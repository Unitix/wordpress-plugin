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
