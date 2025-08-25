import React, { useState, useRef } from 'react';
import CouponPanel from './CouponPanel';
import { useCart } from '../contexts/CartContext';

export default function CartTotals() {
  const { cart, subtotal, taxAmount, totalCost } = useCart();
  const [couponData, setCouponData] = useState({ totals: null, appliedCodes: [] });
  const couponPanelRef = useRef(null);

  const serverDiscount = Array.isArray(cart.discountItems)
    ? Math.abs(cart.discountItems.reduce((s, i) => s + (Number(i.cost) || 0), 0))
    : 0;


  const subtotalFmt = subtotal.toFixed(2);
  const taxFmt = taxAmount.toFixed(2);

  const cartPageTotal = cart.shipmentTotalCost > 0 ? totalCost - cart.shipmentTotalCost : totalCost;

  let displayTotal = cartPageTotal;
  let displayDiscount = serverDiscount;

  if (couponData.appliedCodes.length > 0 && couponData.totals && !isNaN(couponData.totals.total)) {
    displayTotal = couponData.totals.total;
    displayDiscount = Math.abs(couponData.totals.discount || 0);
  }

  const totalFmt = displayTotal.toFixed(2);
  const discountFmt = displayDiscount.toFixed(2);

  const handleTotalsChange = (data) => {
    setCouponData(data);
  };

  const handleRemoveCoupon = (index) => {
    // Call the remove function from CouponPanel via ref
    if (couponPanelRef.current && couponPanelRef.current.removeDiscountCode) {
      couponPanelRef.current.removeDiscountCode(index);
    }
  };

  const { checkoutUrl = '/checkout', cartUrl = '/cart' } = window.scriptData || {};

  return (
    <div className="wc-block-components-sidebar wc-block-cart__sidebar wp-block-woocommerce-cart-totals-block">
      <div className="wp-block-woocommerce-cart-order-summary-block">
        <h2 className="wp-block-woocommerce-cart-order-summary-heading-block wc-block-cart__totals-title">
          Cart totals
        </h2>
        <CouponPanel
          onTotalsChange={handleTotalsChange}
          ref={couponPanelRef}
        />
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
              <span className="wc-block-components-totals-item__value">{`$${taxFmt}`}</span>
            </div>
          </div>

          {(displayDiscount > 0 || couponData.appliedCodes.length > 0) && (
            <div className="wp-block-woocommerce-cart-order-summary-discount-block wc-block-components-totals-wrapper">
              <div className="wc-block-components-totals-item wc-block-components-totals-discount">
                <span className="wc-block-components-totals-item__label">Discount</span>
                <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value">-${discountFmt}</span>
                {couponData.appliedCodes.length > 0 && (
                  <div className="wc-block-components-totals-item__description">
                    <div className="">
                      <div className="" aria-hidden="false">
                        <ul className="wc-block-components-totals-discount__coupon-list">
                          {couponData.appliedCodes.map((coupon, index) => (
                            <li key={index} className="wc-block-components-totals-discount__coupon-list-item is-removable wc-block-components-chip wc-block-components-chip--radius-large">
                              <span aria-hidden="true" className="wc-block-components-chip__text">{coupon.code}</span>
                              <span className="screen-reader-text">Coupon: {coupon.code}</span>
                              <button
                                className="wc-block-components-chip__remove"
                                aria-label={`Remove coupon "${coupon.code}"`}
                                onClick={() => handleRemoveCoupon(index)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" role="img" className="wc-block-components-chip__remove-icon" aria-hidden="true" focusable="false">
                                  <path d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"></path>
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
              href={checkoutUrl}
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
