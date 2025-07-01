import React, { useState } from 'react';

export default function ShippingOptions({
  shipmentGroups = [],
  shipmentOptionsLoading = false,
  register,
  errors = {},
}) {
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  
  return (
    <>
      {shipmentOptionsLoading && (
        <div className="shipping-options-loading">
          <span className="wc-block-components-spinner is-active" />
        </div>
      )}

      {shipmentGroups.length > 0 && (
        <fieldset
          className="wc-block-checkout__shipping-option wp-block-woocommerce-checkout-shipping-methods-block wc-block-components-checkout-step"
          id="shipping-option"
        >
          <legend className="screen-reader-text">Shipping options</legend>

          <div className="wc-block-components-checkout-step__heading">
            <h2 className="wc-block-components-title wc-block-components-checkout-step__title">
              Shipping options
            </h2>
          </div>

          <div className="wc-block-components-checkout-step__container">
            <div className="wc-block-components-checkout-step__content">
              <div className="wc-block-components-notices" />
              <div
                className="wc-block-components-notices__snackbar wc-block-components-notice-snackbar-list"
                tabIndex="-1"
              >
                <div />
              </div>

              <div>
                <div aria-hidden="false">
                  <div className="wc-block-components-shipping-rates-control css-0 e19lxcc00">
                    {shipmentGroups.map((shipmentGroup, groupIdx) => {
                      const selectedIdx = shipmentGroup.quotes.findIndex(
                        (q) => q.id === selectedQuoteId
                      );
                      const posModifier =
                        selectedIdx === 0 ? 'first-selected' : 'last-selected';

                      return (
                        <div
                          className={`wc-block-components-shipping-rates-control__package wc-block-components-shipping-rates-control__package--${posModifier}`}
                          key={shipmentGroup.id}
                        >
                          <p className="wc-block-components-checkout-step__description">
                            Shipment For{' '}
                            {shipmentGroup.cartItems
                              .map((item) => item.product.name)
                              .join(', ')}
                          </p>

                          {errors[`shipping_${shipmentGroup.id}`] && (
                            <div
                              className="wc-block-components-validation-error"
                              role="alert"
                            >
                              <p
                                id={`error-shipping-${shipmentGroup.id}`}
                              >
                                <svg
                                  viewBox="-2 -2 24 24"
                                  width="24"
                                  height="24"
                                  aria-hidden="true"
                                >
                                  <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                                </svg>
                                <span>
                                  {errors[`shipping_${shipmentGroup.id}`].message}
                                </span>
                              </p>
                            </div>
                          )}

                          <div
                            className={`wc-block-components-radio-control wc-block-components-radio-control--highlight-checked wc-block-components-radio-control--highlight-checked--${posModifier}`}
                          >
                            {shipmentGroup.quotes.map((quote) => {
                              const isSelected =
                                selectedQuoteId === quote.id;

                              const labelClasses = [
                                'wc-block-components-radio-control__option',
                                isSelected
                                  ? 'wc-block-components-radio-control__option-checked'
                                  : '',
                                isSelected
                                  ? 'wc-block-components-radio-control__option--checked-option-highlighted'
                                  : '',
                              ].join(' ');

                              return (
                                <label
                                  className={labelClasses}
                                  htmlFor={`radio-control-${groupIdx}-${quote.id}`}
                                  key={quote.id}
                                >
                                  <input
                                    id={`radio-control-${groupIdx}-${quote.id}`}
                                    className="wc-block-components-radio-control__input"
                                    type="radio"
                                    name={`radio-control-${groupIdx}`}
                                    aria-describedby={`radio-control-${groupIdx}-${quote.id}__secondary-label`}
                                    value={quote.id}
                                    {...register(`shipping_${shipmentGroup.id}`, {
                                      required: 'Please choose a shipping option',
                                    })}
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelectedQuoteId(quote.id)
                                    }
                                  />
                                  <div className="wc-block-components-radio-control__option-layout">
                                    <div className="wc-block-components-radio-control__label-group">
                                      <span
                                        id={`radio-control-${groupIdx}-${quote.id}__label`}
                                        className="wc-block-components-radio-control__label"
                                      >
                                        {
                                          quote.shipmentMethod
                                            .transportCompanyName
                                        }
                                      </span>
                                      <span
                                        id={`radio-control-${groupIdx}-${quote.id}__secondary-label`}
                                        className="wc-block-components-radio-control__secondary-label"
                                      >
                                        <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount">
                                          {quote.totalCost != null
                                            ? `$${quote.totalCost.toFixed(2)}`
                                            : ''}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      )}
    </>
  );
}
