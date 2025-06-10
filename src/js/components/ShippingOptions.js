import React, { useState } from 'react';

export default function ShippingOptions({
  shipmentGroups,
  shipmentOptionsLoading,
  register,
  errors
}) {
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  console.log(shipmentGroups);

  return (
    <>
      {shipmentOptionsLoading &&
        <div className="shipping-options-loading">
          <span className="wc-block-components-spinner is-active" />
        </div>
      }
      {shipmentGroups.length > 0 && (
        <div>
          <div className="wc-block-components-checkout-step__heading">
            <h2 className="wc-block-components-title wc-block-components-checkout-step__title">
              Shipping Options
            </h2>
          </div>
          <ul id="shipmentList">
            {shipmentGroups.map((shipmentGroup, index) => (
              <li key={shipmentGroup.id}>
                <p className="wc-block-components-checkout-step__description">
                  Shipment For {shipmentGroup?.cartItems.map(item => item.product.name).join(', ')}
                </p>
                {errors[`shipping_${shipmentGroup.id}`] && (
                  <div className="wc-block-components-validation-error" role="alert">
                    <p id={`error-shipping-${shipmentGroup.id}`}>
                      <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                        <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                      </svg>
                      <span>{errors[`shipping_${shipmentGroup.id}`].message}</span>
                    </p>
                  </div>
                )}
                <ul>
                  {shipmentGroup?.quotes.map((quote) => (
                    <li key={quote.id} className="shipping-option">
                      <span className="shipping-code">
                        {quote.shipmentMethod.name}
                      </span>
                      <label
                        htmlFor={`quote-${quote.id}`}
                        className={
                          'shipping-card' +
                          (selectedQuoteId === quote.id ? ' selected' : '')
                        }
                      >
                        <input
                          type="radio"
                          id={`quote-${quote.id}`}
                          name="quote"
                          value={quote.id}
                          {...register(`shipping_${shipmentGroup.id}`, {
                            required: "Please choose a shipping option",
                          })}
                          checked={selectedQuoteId === quote.id}
                          onChange={() => setSelectedQuoteId(quote.id)}
                          className="shipping-radio"
                        />
                        <span className="shipping-title">
                          {quote.shipmentMethod.transportCompanyName}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
