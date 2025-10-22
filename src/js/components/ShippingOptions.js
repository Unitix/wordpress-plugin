import React, { useState, useEffect, useRef } from 'react';
import { backendUri } from '../utils';
import { patchCartDiscountItems } from '../merchi_public_custom';

export default function ShippingOptions({
  shipmentGroups = [],
  shipmentOptionsLoading = false,
  register,
  errors = {},
  cart,
  syncCartFromStorage,
  MERCHI,
  setIsUpdatingShipping,
}) {

  const [selectedQuoteIds, setSelectedQuoteIds] = useState({});
  const lastChoiceRef = useRef({}); // remember user's last chosen method

  function buildGroupKey(group) {
    try {
      const ids = (group?.cartItems || []).map((i) => i?.product?.id).filter(Boolean).sort();
      return ids.join(',');
    } catch {
      return String(group?.id ?? '');
    }
  }

  function buildQuoteKey(quote) {
    const carrier = quote?.shipmentMethod?.transportCompanyName || '';
    const name = quote?.name || quote?.shipmentMethod?.name || '';
    const cost = String(quote?.totalCost ?? quote?.subtotalCost ?? '');
    return `${carrier}::${name}::${cost}`;
  }

  useEffect(() => {
    const nextSelected = { ...selectedQuoteIds };
    let changed = false;

    shipmentGroups.forEach((group) => {
      const quoteIds = (group.quotes || []).map((q) => q.id);
      const current = nextSelected[group.id];
      const groupKey = buildGroupKey(group);

      if (current == null) {
        const lastKey = lastChoiceRef.current[groupKey];
        if (lastKey) {
          const match = (group.quotes || []).find((q) => buildQuoteKey(q) === lastKey);
          if (match) {
            nextSelected[group.id] = match.id;
            changed = true;
            return;
          }
        }

        const serverSel = group?.selectedQuote?.id;
        if (quoteIds.includes(serverSel)) {
          nextSelected[group.id] = serverSel;
          changed = true;
          return;
        }

        const fallback = quoteIds[0];
        if (fallback != null) {
          nextSelected[group.id] = fallback;
          changed = true;
        }
      } else if (!quoteIds.includes(current)) {
        const lastKey = lastChoiceRef.current[groupKey];
        const match = lastKey ? (group.quotes || []).find((q) => buildQuoteKey(q) === lastKey) : null;
        if (match) {
          nextSelected[group.id] = match.id;
          changed = true;
        } else if (quoteIds.length) {
          nextSelected[group.id] = quoteIds[0];
          changed = true;
        }
      }
    });

    Object.keys(nextSelected).forEach((gid) => {
      if (!shipmentGroups.some((g) => String(g.id) === String(gid))) {
        delete nextSelected[gid];
        changed = true;
      }
    });

    if (changed) {
      setSelectedQuoteIds(nextSelected);
    }
  }, [shipmentGroups]);

  const validShipmentGroups = shipmentGroups.filter(
    (g) => g.cartItems?.length
  );

  return (
    <>
      {shipmentOptionsLoading ? (
        <div className="shipping-options-loading">
          <span className="wc-block-components-spinner is-active" />
        </div>
      ) : (
        validShipmentGroups.length > 0 && (
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
                  {validShipmentGroups.map((shipmentGroup, groupIdx) => {
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

                                    // remember user's logical choice
                                    try {
                                      const gKey = buildGroupKey(shipmentGroup);
                                      const qKey = buildQuoteKey(quote);
                                      lastChoiceRef.current[gKey] = qKey;
                                    } catch { }

                                    setSelectedQuoteIds((prev) => ({
                                      ...prev,
                                      [shipmentGroup.id]: quote.id,
                                    }));
                                    setIsUpdatingShipping(true);

                                    try {
                                      if (!cart?.id) {
                                        throw new Error('Cart ID is missing');
                                      }

                                      if (!cart?.token) {
                                        throw new Error('Cart token is missing');
                                      }

                                      const payload = {
                                        shipmentGroups: shipmentGroups.map((g) =>
                                          g.id === shipmentGroup.id
                                            ? { id: g.id, selectedQuote: { id: quote.id } }
                                            : { id: g.id }
                                        )
                                      };

                                      const response = await fetch(`${backendUri}v6/carts/${cart.id}/?cart_token=${cart.token}`, {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(payload)
                                      });

                                      if (!response.ok) {
                                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                      }

                                      const responseData = await response.json();
                                      const apiCart = responseData.cart || responseData;

                                      const updatedCart = {
                                        ...cart,
                                        ...apiCart,
                                        cartItems: apiCart.cartItems || cart.cartItems || [],
                                        domain: apiCart.domain || cart.domain || {},
                                        shipmentGroups: apiCart.shipmentGroups || cart.shipmentGroups || [],
                                        receiverAddress: apiCart.receiverAddress !== undefined ? apiCart.receiverAddress : cart.receiverAddress,
                                        discountItems: apiCart.discountItems || cart.discountItems || []
                                      };

                                      // Update the specific shipmentGroup with the selected quote
                                      if (updatedCart.shipmentGroups && updatedCart.shipmentGroups.length > 0) {
                                        const targetGroupKey = buildGroupKey(shipmentGroup);
                                        const targetQuoteKey = buildQuoteKey(quote);

                                        updatedCart.shipmentGroups = updatedCart.shipmentGroups.map((g) => {
                                          const gKey = buildGroupKey(g);

                                          if (gKey === targetGroupKey) {
                                            const matchingQuote = (g.quotes || []).find(q => buildQuoteKey(q) === targetQuoteKey);

                                            if (matchingQuote) {
                                              return {
                                                ...g,
                                                selectedQuote: matchingQuote
                                              };
                                            } else {
                                              const byId = (g.quotes || []).find(q => q.id === quote.id);
                                              if (byId) {
                                                return {
                                                  ...g,
                                                  selectedQuote: byId
                                                };
                                              }
                                              return g;
                                            }
                                          }
                                          return g;
                                        });
                                      }


                                      if (Array.isArray(cart.discountItems) && cart.discountItems.length) {
                                        const slim = cart.discountItems.map(({ code, id, description = '', cost }) => ({
                                          code,
                                          id,
                                          description,
                                          cost,
                                        }));
                                        const patched2 = await patchCartDiscountItems(updatedCart, slim);
                                        Object.assign(updatedCart, MERCHI.toJson(patched2));
                                      }

                                      localStorage.setItem('MerchiCart', JSON.stringify(updatedCart));

                                      if (syncCartFromStorage) {
                                        syncCartFromStorage();
                                      }
                                    } catch (err) {
                                      console.error('[ShippingOptions] fetch PATCH error:', err);
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
                                      {quote.name || quote.shipmentMethod.name || quote.shipmentMethod.transportCompanyName}
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
        )
      )}
    </>
  );
}
