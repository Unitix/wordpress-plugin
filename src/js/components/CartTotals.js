import React from 'react';

export default function CartTotals({ cart }) {
  const subtotal = cart.totalCost ?? 0;
  const shipping = cart.shippingCost ?? 0;
  const tax = cart.taxAmount ?? 0;
  const total = subtotal + shipping + tax;

  return (
    <div className="wc-block-components-sidebar wc-block-cart__sidebar wp-block-woocommerce-cart-totals-block">
      <div className="wp-block-woocommerce-cart-order-summary-block">
        <h2 className="wp-block-woocommerce-cart-order-summary-heading-block wc-block-cart__totals-title">
          Cart totals
        </h2>

        <div className="wp-block-woocommerce-cart-order-summary-totals-block">
          {[
            ['Subtotal', subtotal],
            ['Shipping', shipping],
            ['Tax', tax],
          ].map(([label, value]) => (
            <div key={label} className="wc-block-components-totals-wrapper">
              <div className="wc-block-components-totals-item">
                <span className="wc-block-components-totals-item__label">{label}</span>
                <span className="wc-block-components-totals-item__value">{`$${value}`}</span>
              </div>
            </div>
          ))}

          <div className="wc-block-components-totals-wrapper">
            <div className="wc-block-components-totals-item wc-block-components-totals-footer-item">
              <span className="wc-block-components-totals-item__label">Total</span>
              <span className="wc-block-components-totals-item__value">{`$${total}`}</span>
            </div>
          </div>
        </div>

        <div className="wc-block-cart__submit wp-block-woocommerce-proceed-to-checkout-block">
          <div className="wc-block-cart__submit-container">
            <a href="/checkout" className="wc-block-components-button wp-element-button wc-block-cart__submit-button contained">
              <span className="wc-block-components-button__text">Proceed to Checkout</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
