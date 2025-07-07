import React, { useState } from 'react';
import { cartEmbed } from '../utils';

export default function ShippingOptions({
  shipmentGroups = [],
  shipmentOptionsLoading = false,
  register,
  errors = {},
  patchCart,
  cart,
  setCart,
  MERCHI,
  setIsUpdatingShipping,
}) {

  const [selectedQuoteIds, setSelectedQuoteIds] = useState({});

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
              <div className="wc-block-components-shipping-rates-control css-0 e19lxcc00">
                {shipmentGroups.map((shipmentGroup, groupIdx) => {
                  const fieldName = `shipping_${shipmentGroup.id}`;
                  const isFirstSel =
                    shipmentGroup.quotes.findIndex(
                      (q) => q.id === selectedQuoteIds[shipmentGroup.id]
                    ) === 0;
                  const posModifier = isFirstSel ? 'first-selected' : 'last-selected';

                  const rhf = register(fieldName, {
                    required: 'Please select a shipping method',
                  });

                  return (
                    <div
                      key={shipmentGroup.id}
                      className={`wc-block-components-shipping-rates-control__package wc-block-components-shipping-rates-control__package--${posModifier}`}
                    >
                      <p className="wc-block-components-checkout-step__description">
                        Shipment For{' '}
                        {shipmentGroup.cartItems
                          .map((i) => i.product.name)
                          .join(', ')}
                      </p>

                      {errors[fieldName] && (
                        <div
                          className="wc-block-components-validation-error"
                          role="alert"
                        >
                          <p id={`error-${fieldName}`}>
                            <svg viewBox="-2 -2 24 24" width="24" height="24">
                              <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                            </svg>
                            <span>{errors[fieldName].message}</span>
                          </p>
                        </div>
                      )}

                      <div
                        className={`wc-block-components-radio-control wc-block-components-radio-control--highlight-checked wc-block-components-radio-control--highlight-checked--${posModifier}`}
                      >
                        {shipmentGroup.quotes.map((quote) => {
                          const isSelected =
                            selectedQuoteIds[shipmentGroup.id] === quote.id;

                          const labelCls = [
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
                              key={quote.id}
                              htmlFor={`radio-${groupIdx}-${quote.id}`}
                              className={labelCls}
                            >
                              <input
                                id={`radio-${groupIdx}-${quote.id}`}
                                type="radio"
                                value={quote.id}
                                {...rhf}
                                checked={isSelected}
                                aria-describedby={`radio-${groupIdx}-${quote.id}__secondary-label`}
                                className="wc-block-components-radio-control__input"
                                onChange={async (e) => {
                                  rhf.onChange(e);

                                  setSelectedQuoteIds((prev) => ({
                                    ...prev,
                                    [shipmentGroup.id]: quote.id,
                                  }));
                                  setIsUpdatingShipping(true);

                                  const newCart = {
                                    ...cart,
                                    shipmentGroups: shipmentGroups.map((g) =>
                                      g.id === shipmentGroup.id
                                        ? { id: g.id, selectedQuote: { id: quote.id } }
                                        : { id: g.id }
                                    ),
                                  };

                                  try {
                                    const cartEnt = await patchCart(newCart, cartEmbed, { includeShippingFields: true });
                                    const cartJson = MERCHI.toJson(cartEnt);

                                    setCart(cartJson);
                                    localStorage.setItem(
                                      'MerchiCart',
                                      JSON.stringify(cartJson)
                                    );
                                  } catch (err) {
                                    console.error('[ShippingOptions] patchCart error:', err);
                                  } finally {
                                    setIsUpdatingShipping(false);
                                  }
                                }}
                              />

                              <div className="wc-block-components-radio-control__option-layout">
                                <div className="wc-block-components-radio-control__label-group">
                                  <span
                                    id={`radio-${groupIdx}-${quote.id}__label`}
                                    className="wc-block-components-radio-control__label"
                                  >
                                    {quote.shipmentMethod.transportCompanyName}
                                  </span>
                                  <span
                                    id={`radio-${groupIdx}-${quote.id}__secondary-label`}
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
        </fieldset>
      )}
    </>
  );
}
