import React, { useState } from 'react';

export default function CouponPanel() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');

  const toggle = () => setOpen((o) => !o);

  return (
    <div className="wp-block-woocommerce-checkout-order-summary-coupon-form-block wc-block-components-totals-wrapper">
      <div
        role="heading"
        aria-level="2"
        className="wc-block-components-totals-coupon wc-block-components-panel"
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          className="wc-block-components-panel__button"
          onClick={toggle}
        >
          <svg
            className="wc-block-components-panel__button-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d={
                open
                  ? 'M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z'
                  : 'M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z'
              }
            />
          </svg>
          Add a coupon
        </div>

        {open && (
          <div className="wc-block-components-panel__content">
            <div className="">
              <div className="" aria-hidden="false">
                <div className="wc-block-components-totals-coupon__content">
                  <form
                    id="wc-block-components-totals-coupon__form"
                    className="wc-block-components-totals-coupon__form"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <div className="wc-block-components-text-input wc-block-components-totals-coupon__input">
                      <input
                        id="wc-block-components-totals-coupon__input-coupon"
                        className="wc-block-components-text-input__input"
                        type="text"
                        aria-label="Enter code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                      <label
                        htmlFor="wc-block-components-totals-coupon__input-coupon"
                        className="wc-block-components-text-input__label"
                      >
                        Enter code
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="wc-block-components-button wp-element-button wc-block-components-totals-coupon__button contained"
                      disabled={!code.trim()}
                      aria-disabled={!code.trim()}
                      style={{ pointerEvents: !code.trim() ? 'none' : 'auto' }}
                    >
                      <span className="wc-block-components-button__text">
                        Apply
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
