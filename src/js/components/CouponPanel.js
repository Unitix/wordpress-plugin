import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MERCHI_SDK } from '../merchi_sdk';
import { patchCart } from '../merchi_public_custom';

const CouponPanel = forwardRef(({ onTotalsChange }, ref) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [appliedCodes, setAppliedCodes] = useState([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  });

  const wrapperRef = useRef(null);
  const merchi = MERCHI_SDK();

  useImperativeHandle(ref, () => ({
    removeDiscountCode
  }));

  const handleFocus = () => {
    wrapperRef.current?.classList.add('is-active');
  };

  const handleBlur = (e) => {
    if (!e.target.value.trim()) {
      wrapperRef.current?.classList.remove('is-active');
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setCode(val);
    if (error) setError('');
  };

  const toggle = () => setOpen((o) => !o);

  // get cart ID
  const getCartId = () => {
    try {
      const merchiCart = localStorage.getItem('MerchiCart');
      if (merchiCart) {
        const cartData = JSON.parse(merchiCart);
        return cartData.id;
      }
    } catch (error) {
      console.error('Error parsing MerchiCart from localStorage:', error);
    }
    return null;
  };

  const syncTotalsFromCart = (cart) => {
    const subtotal = Number(cart.subtotalCost ?? 0);
    const discount = Math.abs(Number(cart.discountedAmount ?? 0));
    const tax = Number(cart.taxAmount ?? 0);
    setTotals({
      subtotal,
      discount,
      tax,
      total: Number(cart.totalCost ?? 0),
    });
  };

  const validateDiscountCode = async (discountCode) => {
    if (!discountCode.trim()) {
      setError('Please enter a discount code');
      return;
    }

    const cartId = getCartId();
    if (!cartId) {
      setError('Cart not found. Please refresh the page.');
      return;
    }

    console.log('Validating discount code:', discountCode);
    console.log('Cart ID:', cartId);

    setLoading(true);
    setError('');

    try {
      const merchiCart = localStorage.getItem('MerchiCart');
      if (!merchiCart) {
        setError('Cart data not found. Please refresh the page.');
        setLoading(false);
        return;
      }

      const cartData = JSON.parse(merchiCart);
      const cartToken = cartData.token;

      const apiUrl = window.scriptData?.merchi_url || 'https://api.staging.merchi.co/';
      const url = `${apiUrl}v6/carts/${cartId}/check_discount_code/?cart_token=${cartToken}&codes=${encodeURIComponent(discountCode)}`;

      console.log('API URL:', url);

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }

      const response = await fetchResponse.json();
      console.log('API Response:', response);

      if (response && response.items && response.items.length > 0) {
        const discountItem = response.items[0];
        console.log('Discount item found:', discountItem);
        console.log('Full discount item object:', JSON.stringify(discountItem, null, 2));

        // Check if this discount code is already applied
        const isAlreadyApplied = appliedCodes.some(c => c.code === discountCode);
        if (isAlreadyApplied) {
          setError('This discount code is already applied');
          return;
        }

        const newDiscountItem = {
          code: discountItem.code || discountCode,
          description: discountItem.description || '',
          cost: Number(discountItem.cost ?? 0)
        };

        setAppliedCodes(prev => [...prev, newDiscountItem]);
        setCode('');

        // Update localStorage cart with discount items
        try {
          const merchiCart = localStorage.getItem('MerchiCart');
          if (merchiCart) {
            const cartData = JSON.parse(merchiCart);
            cartData.discountItems = [...(cartData.discountItems || []), newDiscountItem];
            localStorage.setItem('MerchiCart', JSON.stringify(cartData));
            console.log('Updated cart with discount items');

            // Sync discount items to server
            try {
              const updated = await patchCart(cartData);
              syncTotalsFromCart(updated || cartData);
              console.log('Successfully synced discount items to server');

              setOpen(false);
            } catch (patchError) {
              console.error('Failed to sync discount items to server:', patchError);
            }
          }
        } catch (error) {
          console.error('Error updating localStorage cart with discount:', error);
        }

      } else {
        console.log('No discount items found in response');
        console.log('Full response structure:', JSON.stringify(response, null, 2));

        // Check if response has error message
        if (response && response.error) {
          setError(`Error: ${response.error}`);
        } else if (response && response.message) {
          setError(`Error: ${response.message}`);
        } else {
          setError('Invalid discount code or discount code not found');
        }
      }

    } catch (err) {
      console.error('Discount validation error:', err);

      if (err.message.includes('404')) {
        setError('Discount code not found');
      } else if (err.message.includes('400')) {
        setError('Invalid request. Please check the discount code.');
      } else if (err.message.includes('401') || err.message.includes('403')) {
        setError('Authentication error. Please refresh the page.');
      } else {
        setError('Failed to validate discount code');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeDiscountCode = (index) => {
    const updatedCodes = appliedCodes.filter((_, i) => i !== index);
    setAppliedCodes(updatedCodes);

    // Update localStorage cart
    try {
      const merchiCart = localStorage.getItem('MerchiCart');
      if (merchiCart) {
        const cartData = JSON.parse(merchiCart);
        cartData.discountItems = updatedCodes;
        localStorage.setItem('MerchiCart', JSON.stringify(cartData));

        // Sync removal to server
        patchCart(cartData)
          .then((updated) => {
            syncTotalsFromCart(updated || cartData);
            console.log('Successfully synced discount removal to server');
          })
          .catch((patchError) => {
            console.error('Failed to sync discount removal to server:', patchError);
          });
      }
    } catch (error) {
      console.error('Error updating localStorage cart after discount removal:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await validateDiscountCode(code);
  };

  useEffect(() => {
    const merchiCart = localStorage.getItem('MerchiCart');
    if (merchiCart) {
      const cartData = JSON.parse(merchiCart);
      syncTotalsFromCart(cartData);

      if (cartData.discountItems && cartData.discountItems.length > 0) {
        setAppliedCodes(cartData.discountItems);
      }
    }
  }, []);

  useEffect(() => {
    if (open && wrapperRef.current && code.trim()) {
      wrapperRef.current.classList.add('is-active');
    }
  }, [open, code]);

  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange({ totals, appliedCodes });
    }
  }, [totals, appliedCodes, onTotalsChange]);

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
                    onSubmit={handleSubmit}
                  >
                    <div
                      ref={wrapperRef}
                      className="wc-block-components-text-input wc-block-components-totals-coupon__input">
                      <input
                        id="wc-block-components-totals-coupon__input-coupon"
                        className="wc-block-components-text-input__input"
                        type="text"
                        aria-label="Enter code"
                        placeholder=" "
                        value={code}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        disabled={loading}
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
                      disabled={!code.trim() || loading}
                      aria-disabled={!code.trim() || loading}
                    >
                      <span className="wc-block-components-button__text">
                        {loading ? 'Applying...' : 'Apply'}
                      </span>
                    </button>
                  </form>

                  {error && (
                    <div style={{
                      color: '#d63638',
                      fontSize: '14px',
                      marginTop: '8px'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* appliedCodes
                  {appliedCodes.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        Applied Coupons:
                      </div>
                      {appliedCodes.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            marginBottom: '4px',
                            fontSize: '14px'
                          }}
                        >
                          <span>
                            <strong>{item.code}</strong>
                            {item.description && ` - ${item.description}`}
                            {item.cost !== undefined && (
                              item.cost === 0
                                ? ' (Applied)'
                                : ` (-$${item.cost.toFixed(2)})`
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDiscountCode(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d63638',
                              cursor: 'pointer',
                              fontSize: '18px',
                              padding: '4px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CouponPanel;
