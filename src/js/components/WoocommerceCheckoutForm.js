import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2'
import { useForm, Controller } from 'react-hook-form';
import WoocommerceCheckoutFormSideCart from './WoocommerceCheckoutFormSideCart';
import AddressForm from './AddressForm';
import ShippingOptions from './ShippingOptions';
import StripePaymentForm from './StripePaymentForm';
import { patchCart } from '../merchi_public_custom';
import { MERCHI_API_URL, MERCHI_SDK } from '../merchi_sdk';
import { useCart } from '../contexts/CartContext';
import 'react-phone-input-2/lib/style.css';
import { ensureWooNonce, fetchWooNonce, updateWooNonce, getCountryFromBrowser, toIso, cleanShipmentGroups, getWpApiRoot } from '../utils';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { mergeCartProducts } from '../utils';

async function createClient(MERCHI, clientJson, cartJson) {
  return new Promise((resolve, reject) => {
    const { domain = {} } = cartJson;
    const registeredUnderDomains = domain?.id
      ? [{ id: domain.id }]
      : undefined;

    const clientEnt = MERCHI.fromJson(
      new MERCHI.User(),
      { ...clientJson, registeredUnderDomains }
    );

    const data = MERCHI.serialise(clientEnt, null, null, null, { excludeOld: false })[0];

    const request = new MERCHI.Request();
    request.resource('/public_user_create/');
    request.method('POST');
    request.data().merge(data);

    function handleResponse(status, data) {
      if (status === 201) {
        resolve(data);
      } else {
        reject(data);
      }
    }

    function handleError() {
      reject({
        message: 'could not connect to server',
        errorCode: 0
      });
    }

    request.responseHandler(handleResponse).errorHandler(handleError);
    request.send();
  });
}

const WoocommerceCheckoutForm = () => {
  const { cart, updateCart, clearCart } = useCart();
  const [orderInfo, setOrderInfo] = useState({ cart, client: null, receiverAddress: null });

  useEffect(() => {
    setOrderInfo(prev => ({ ...prev, cart }));
  }, [cart]);

  const { domain = {} } = cart;
  const { country = 'AU' } = domain;

  // Shipping address state
  const browserCountry =
    getCountryFromBrowser() ||
    cart?.receiverAddress?.country ||
    null;

  const [selectedShippingCountry, setSelectedShippingCountry] =
    useState(browserCountry);

  const [selectedShippingState, setSelectedShippingState] = useState(null);
  const { control, register, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
    defaultValues: {
      shipping_country: browserCountry || '',
      billing_country: browserCountry || '',
    }
  });

  const [shipmentGroups, setShipmentGroups] = useState([]);
  const [shipmentOptionsLoading, setShipmentOptionsLoading] = useState(false);
  const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);

  const MERCHI = MERCHI_SDK();

  async function getShippingGroup() {
    const merchi_api_url = MERCHI_API_URL();
    const { id, token } = cart;

    if (token) {
      const requestOptions = { method: 'GET', redirect: 'follow' };
      try {
        const response = await fetch(
          `${merchi_api_url}v6/generate-cart-shipment-quotes/${id}/?cart_token=${token}`,
          requestOptions
        );
        const { shipmentGroups } = await response.json();
        setShipmentGroups(shipmentGroups.filter((g) => g.cartItems?.length));
        return;
      } catch (error) {
        setShipmentGroups([]);
        throw error;
      }
    }
  }

  async function changeShippingCountryOrState(country, state) {
    setShipmentOptionsLoading(true);
    const c = toIso(country);
    const s = toIso(state);

    const cartJson = {
      ...cart,
      receiverAddress: { ...cart.receiverAddress, country: c, state: s },
      shipmentGroups: [],
    };
    try {
      // the patch with selectedQuote is sent only after the user picks one
      const cartEnt = await patchCart(cartJson, undefined, { includeShippingFields: true });
      const _cartJson = MERCHI.toJson(cartEnt);

      const cleanedCartJson = cleanShipmentGroups(_cartJson);
      const merged = mergeCartProducts(cleanedCartJson, cart);
      await updateCart(merged);
      await getShippingGroup();
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setShipmentOptionsLoading(false);
    }
  }

  useEffect(() => {
    if (browserCountry) {
      setValue('shipping_country', browserCountry);
      changeShippingCountryOrState(browserCountry, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedShippingCountry) {
      changeShippingCountryOrState(selectedShippingCountry, selectedShippingState);
    }
  }, [selectedShippingCountry, selectedShippingState]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberCountry, setPhoneNumberCountry] = useState('');

  const [orderLoading, setOrderLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentStep, setCurrentStep] = useState('details'); // 'details' or 'payment'

  useEffect(() => {
  }, [orderLoading, currentStep]);


  async function placeOrder() {
    setOrderLoading(true);
    const {
      client,
      shipping_address_1,
      shipping_address_2,
      shipping_city,
      shipping_postcode
    } = getValues();

    let cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cart);
    try {
      // try update or create new client
      const cartClientEmail =
        cart?.client?.emailAddresses?.[0]?.emailAddress ?? '';

      const formClientEmail =
        client?.emailAddresses?.[0]?.emailAddress ?? '';

      if (!cart?.client?.id || cartClientEmail !== formClientEmail) {
        const newCartClient = await createClient(
          MERCHI,
          {
            name: client.name,
            emailAddresses: [{ emailAddress: client.emailAddresses[0].emailAddress }],
            phoneNumbers: [{ code: phoneNumberCountry, number: phoneNumber }],
          },
          cart
        );

        // create a new order object with the new client before reconstructing the cart object for patch
        setOrderInfo({
          cart: orderInfo.cart,
          client: newCartClient.user,
          receiverAddress: {
            lineOne: shipping_address_1,
            lineTwo: shipping_address_2,
            city: shipping_city,
            postcode: shipping_postcode,
            country: selectedShippingCountry,
            state: selectedShippingState,
          },
          orderNote: getValues('order_notes') || ''
        });

        const newCartClientEnt = MERCHI.fromJson(new MERCHI.User(), { id: newCartClient.user.id });

        cartEnt.client(newCartClientEnt);
      }

      const addressEnt = new MERCHI.Address();

      addressEnt.lineOne(shipping_address_1);
      addressEnt.lineTwo(shipping_address_2);
      addressEnt.city(shipping_city);
      addressEnt.postcode(shipping_postcode);
      addressEnt.country(selectedShippingCountry);
      addressEnt.state(selectedShippingState);

      cartEnt.receiverAddress(addressEnt);

      //convert cartEnt to json
      const cartJson = MERCHI.toJson(cartEnt);
      //delete the id of cart item from cartItems

      // Patch the cart data to Merchi server
      await patchCart(cartJson)
        .then(async response => {
          //turn merchi entity response to json
          const responseJson = MERCHI.toJson(response);
          await updateCart(responseJson);
          setOrderInfo(prev => ({
            ...prev,
            cart: responseJson,
            client: {
              ...prev.client,
              name: getValues('client.name'),
              emailAddresses: [
                { emailAddress: getValues('client.emailAddresses[0].emailAddress') }
              ]
            },
            orderNote: getValues('order_notes') || ''
          }));
        })
        .catch(e => console.warn('[MerchiSync] patchCart error:', e.response?.status || e));

      const merchi_api_url = MERCHI_API_URL();
      const response = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/${cartEnt.id()}/?cart_token=${cartEnt.token()}`);
      const data = await response.json();
      setStripeClientSecret(data.stripeClientSecret);
      setCurrentStep('payment');

      // Directly proceed to order confirmation
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setOrderLoading(false);
    }
  }
  const handlePaymentSuccess = async (paymentIntent) => {

    try {
      //refetch the cart from the server
      localStorage.setItem(
        'MerchiOrder',
        JSON.stringify({ ...orderInfo, cart })
      );

      // clear the cart after successful order placement  
      clearCart();

      // clear the minicart
      async function clearWooCart() {
        const nonce = await ensureWooNonce();
        const apiRoot = getWpApiRoot();

        const doClear = (n) =>
          fetch(`${apiRoot}wc/store/v1/cart/items`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-WC-Store-API-Nonce': n,
              'Nonce': n,
            },
          });

        let res = await doClear(nonce);
        if (res.status === 403) res = await doClear(await fetchWooNonce());
        if (!res.ok) {
          console.warn('[Woo] empty-cart error:', res.status);
          return;
        }

        updateWooNonce(res);
        sessionStorage.removeItem('wc/cart');

        const wpData = window.wp?.data;
        if (wpData) {
          wpData.dispatch('wc/store/cart')?.clearItems?.();
          wpData.dispatch('wc/store')?.clearCart?.();
        }
      }

      await clearWooCart();

      const merchi_api_url = MERCHI_API_URL();

      const completeResponse = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/complete/${cart.id}/?cart_token=${cart.token}`);
      const cartJsonrefetched = await completeResponse.json();

      // Handle successful payment
      // window.location.href = window.location.origin + '/thankyou?merchi_value=' + orderInfo.cart.totalCost + '&invoice_id=' + cartJsonrefetched.invoice.id + '&email=' + orderInfo.client.emailAddresses[0].emailAddress;
      window.location.href = (
        window.scriptData?.checkoutUrl
          ? window.scriptData.checkoutUrl.replace(/\/checkout\/?$/, '/thankyou')
          : (window.location.origin + window.location.pathname).replace(/\/checkout\/?$/, '/thankyou')
      ) +
        '?merchi_value=' + orderInfo.cart.totalCost +
        '&invoice_id=' + cartJsonrefetched.invoice.id +
        '&email=' + orderInfo.client.emailAddresses[0].emailAddress;

      //parameters merchi value, invoice id, email
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment error (show message, etc.)
  };

  const { cartUrl = '/cart/' } = window.scriptData || {};

  return (
    <>
      {orderLoading && currentStep === 'details' && (
        <div className="payment-overlay" role="alert" aria-live="assertive">
          <span
            className="wc-block-components-spinner is-active payment-spinner"
            aria-hidden="true"
          />
        </div>
      )}
      <div className='wp-block-woocommerce-checkout alignwide wc-block-checkout'>
        <div className='wc-block-components-sidebar-layout wc-block-checkout is-large'>
          <div className="wc-block-components-main wc-block-checkout__main wp-block-woocommerce-checkout-fields-block">
            {currentStep === 'details' ? (

              <form onSubmit={handleSubmit(placeOrder)} className='wc-block-components-form wc-block-checkout__form' >
                <fieldset className="wc-block-checkout__contact-fields wp-block-woocommerce-checkout-contact-information-block wc-block-components-checkout-step" id="contact-fields">
                  <legend className="screen-reader-text">Contact information</legend>
                  <div className="wc-block-components-checkout-step__heading">
                    <h2 className="wc-block-components-title wc-block-components-checkout-step__title">Contact information</h2>
                    <span className="wc-block-components-checkout-step__heading-content"></span>
                  </div>
                  <div className="wc-block-components-checkout-step__container">
                    <p className="wc-block-components-checkout-step__description">
                      We'll use this your contact information to send you details and updates about your order.
                    </p>
                    <div className="wc-block-components-checkout-step__content">
                      <div className="wc-block-components-notices"></div>
                      <div className="wc-block-components-notices__snackbar wc-block-components-notice-snackbar-list" tabIndex="-1">
                        <div></div>
                      </div>
                      <div id="contact" className="wc-block-components-address-form">
                        <div className={`wc-block-components-text-input wc-block-components-address-form__first_name 
                        ${errors.cart?.client?.name ? 'has-error' : ''}`}>
                          <label htmlFor="billing_first_name">Full Name *</label>
                          <input
                            type="text"
                            id="billing_first_name"
                            className="wc-block-components-text-input__input input-text"
                            {...register("client.name", { required: "Full name is required" })}
                          />
                          {errors.cart?.client?.name &&
                            <div className="wc-block-components-validation-error" role="alert">
                              <p id="error-billing-name">
                                <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                                  <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                                </svg>
                                <span>{errors.cart.client.name.message}</span>
                              </p>
                            </div>
                          }
                        </div>

                        <div className={`wc-block-components-text-input wc-block-components-address-form__email 
                        ${errors.client?.emailAddresses?.[0]?.emailAddress ? 'has-error' : ''}`}>
                          <label htmlFor="client.emailAddresses[0].emailAddress">Email Address *</label>
                          <input
                            type="email"
                            id="client.emailAddresses[0].emailAddress"
                            className="wc-block-components-text-input__input input-text"
                            noValidate="novalidate"
                            {...register("client.emailAddresses[0].emailAddress", {
                              required: "Email is required",
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Please enter a valid email address"
                              }
                            })}
                          />
                          {errors.client?.emailAddresses?.[0]?.emailAddress &&
                            <div className="wc-block-components-validation-error" role="alert">
                              <p id="error-billing-email">
                                <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                                  <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                                </svg>
                                <span>{errors.client.emailAddresses[0].emailAddress.message}</span>
                              </p>
                            </div>
                          }
                        </div>

                        <div className={`wc-block-components-text-input
                                      wc-block-components-address-form__phone
                                      ${errors?.client?.phoneNumbers?.[0]?.phoneNumber ? 'has-error' : ''}`}>
                          <label htmlFor="client.phoneNumbers[0].phoneNumber" className="wc-block-components-text-input__label">Phone Number *</label>
                          <Controller
                            control={control}
                            name="client.phoneNumbers[0].phoneNumber"
                            rules={{
                              required: 'Phone number is required',
                              validate: v => {
                                const num = parsePhoneNumberFromString(v.replace(/\s+/g, ''), phoneNumberCountry);
                                return (num && num.isValid()) || 'Please enter a valid phone number';
                              }
                            }}
                            render={({ field }) => (
                              <PhoneInput
                                {...field}
                                country={(selectedShippingCountry || 'AU').toLowerCase()}
                                countryCodeEditable={false}
                                autoFormat={false}
                                containerStyle={{
                                  height: '3.125em'
                                }}
                                buttonStyle={{
                                  height: '100%'
                                }}
                                className="wc-block-components-text-input__input"
                                inputStyle={{ height: '100%', paddingLeft: '40px', width: '100%' }}
                                preferredCountries={['au', 'nz', 'uk', 'us']}
                                inputProps={{
                                  ref: field.ref,
                                  required: true,
                                  autoFocus: true
                                }}
                                onChange={(value, country) => {
                                  field.onChange(value);
                                  setPhoneNumber(value);
                                  setPhoneNumberCountry(country.countryCode.toUpperCase());
                                }}
                              />
                            )}
                          />
                          {errors?.client?.phoneNumbers?.[0]?.phoneNumber && (
                            <div className="wc-block-components-validation-error" role="alert">
                              <p id="error-phone-number">
                                <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                                  <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
                                </svg>
                                <span>{errors.client.phoneNumbers[0].phoneNumber.message}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset
                  id="billing-fields"
                  className="wc-block-checkout__billing-fields
             wp-block-woocommerce-checkout-billing-address-block
             wc-block-components-checkout-step"
                >
                  <div className="wc-block-components-checkout-step__heading">
                    <h2 className="wc-block-components-title wc-block-components-checkout-step__title">
                      Shipping address
                    </h2>
                  </div>
                  <div className="wc-block-components-checkout-step__container">
                    <p className="wc-block-components-checkout-step__description">
                      Enter the address where you want your order delivered.
                    </p>
                    <AddressForm
                      type="shipping"
                      register={register}
                      errors={errors}
                      selectedCountry={selectedShippingCountry}
                      setSelectedCountry={setSelectedShippingCountry}
                      selectedState={selectedShippingState}
                      setSelectedState={setSelectedShippingState}
                      setValue={setValue}
                    />
                  </div>
                </fieldset>

                <ShippingOptions
                  shipmentGroups={shipmentGroups}
                  shipmentOptionsLoading={shipmentOptionsLoading}
                  register={register}
                  errors={errors}
                  patchCart={patchCart}
                  cart={cart}
                  updateCart={updateCart}
                  MERCHI={MERCHI}
                  setIsUpdatingShipping={setIsUpdatingShipping}
                />
                <div className="wc-block-checkout__order-notes wp-block-woocommerce-checkout-order-note-block wc-block-components-checkout-step" id="order-notes">
                  <div className="wc-block-components-checkout-step__container">
                    <div className="wc-block-components-checkout-step__content">
                      <div className="wc-block-components-textarea-field">
                        <label htmlFor="order_notes">Order Notes (optional)</label>
                        <textarea
                          id="order_notes"
                          className="wc-block-components-textarea"
                          placeholder="Notes about your order, e.g. special notes for delivery"
                          {...register("order_notes")}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="css-0 e19lxcc00"></div>
                <div class="wc-block-checkout__terms wc-block-checkout__terms--with-separator wp-block-woocommerce-checkout-terms-block">
                  <span class="wc-block-components-checkbox__label">By proceeding with your purchase you agree to our Terms and Conditions and Privacy Policy</span>
                </div>

                <div className="wc-block-checkout__actions wp-block-woocommerce-checkout-actions-block">
                  <div className="wc-block-checkout__actions_row">
                    <a
                      href={cartUrl}
                      className="wc-block-components-checkout-return-to-cart-button"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                        <path d="M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z" />
                      </svg>
                      Return to Cart
                    </a>

                    <button
                      type="submit"
                      className='button wp-element-button'
                      disabled={orderLoading}
                    >
                      <span className="wc-block-components-button__text">
                        {orderLoading ? (
                          <div className="wc-block-components-checkout-place-order-button__text">Processing…</div>
                        ) : (
                          <div className="wc-block-components-checkout-place-order-button__text">Continue to Payment</div>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onBack={() => { window.location.href = cartUrl; }}
              />
            )}
          </div>
          <WoocommerceCheckoutFormSideCart
            loading={shipmentOptionsLoading}
            isUpdatingShipping={isUpdatingShipping}
            allowRemoveCoupon={currentStep === 'details'}
          />
        </div>
      </div>
    </>
  );
};

export default WoocommerceCheckoutForm;
