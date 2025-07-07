import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2'
import { useForm } from 'react-hook-form';
import WoocommerceCheckoutFormSideCart from './WoocommerceCheckoutFormSideCart';
import AddressForm from './AddressForm';
import ShippingOptions from './ShippingOptions';
import StripePaymentForm from './StripePaymentForm';
import { patchCart } from '../merchi_public_custom';
import { MERCHI_API_URL, MERCHI_SDK } from '../merchi_sdk';
import 'react-phone-input-2/lib/style.css';
import { getCart } from '../merchi_public_custom';
import { ensureWooNonce, fetchWooNonce, updateWooNonce } from '../utils';

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
  const localCartJSONString = localStorage.getItem("MerchiCart");
  const localCart = JSON.parse(localCartJSONString) || {};
  // save localCart to orderInfo before doing patch cart
  const [cart, setCart] = useState(localCart);

  useEffect(() => {
    if (!localCart.id) return;
    (async () => {
      try {
        const ent = await patchCart(
          { id: localCart.id, token: localCart.token },
          cartEmbed,
          { includeShippingFields: true }
        );
        const full = MERCHI.toJson(ent);
        setCart(full);
        localStorage.setItem('MerchiCart', JSON.stringify(full));
        setShipmentGroups(full.shipmentGroups || []);
      } catch (err) {
        console.warn('[Checkout] init patch error', err);
      }
    })();
  }, []);

  const { domain = {} } = cart;
  const { country = 'AU' } = domain;
  // const [orderInfo, setOrderInfo] = useState({ cart: localCart });
  const [orderInfo, setOrderInfo] = useState({ cart, client: null, receiverAddress: null });

  useEffect(() => {
    setOrderInfo(prev => ({ ...prev, cart }));
  }, [cart]);

  // Shipping address state
  const [selectedShippingCountry, setSelectedShippingCountry] = useState(null);
  const [selectedShippingState, setSelectedShippingState] = useState(null);
  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    // Handle form submission here
  };

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
        setShipmentGroups(shipmentGroups);
        return;
      } catch (error) {
        console.log('Error fetching shipping data:', error);
        setShipmentGroups([]);
        throw error;
      }
    }
  }

  async function changeShippingCountryOrState(country, state) {
    setShipmentOptionsLoading(true);
    const c = country?.iso2 || '';
    const s = state?.iso2 || '';
    const cartJson = {
      ...cart,
      receiverAddress: { ...cart.receiverAddress, country: c, state: s },
      shipmentGroups: [],
    };
    try {
      const cartEnt = await patchCart(cartJson, null, { includeShippingFields: true });
      const _cartJson = MERCHI.toJson(cartEnt);
      setCart(_cartJson);
      await getShippingGroup();
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setShipmentOptionsLoading(false);
    }
  }
  useEffect(() => {
    changeShippingCountryOrState(selectedShippingCountry, selectedShippingState);

  }, [selectedShippingCountry, selectedShippingState]);


  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberCountry, setPhoneNumberCountry] = useState('');

  const [orderLoading, setOrderLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentStep, setCurrentStep] = useState('details'); // 'details' or 'payment'

  async function placeOrder() {
    setOrderLoading(true);
    const {
      client,
      shipping_address_1,
      shipping_address_2,
      shipping_city,
      shipping_postcode
    } = getValues();

    // Get MerchiCart data from localStorage
    // const merchiCartData = JSON.parse(localStorage.getItem('MerchiCart') || '{}');

    let cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cart);
    try {
      // try update or create new client
      if (!cart?.client?.id || cart?.emailAddresses[0]?.emaillAddress !== client?.emailAddesses[0]?.emailAddress) {
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
          }
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

      //reset the cart global state with the new cart json
      setCart(cartJson);
      //delete the id of cart item from cartItems

      // Patch the cart data to Merchi server
      await patchCart(cartJson)
        .then(response => {
          //turn merchi entity response to json
          const responseJson = MERCHI.toJson(response);
          console.log('responseJson', responseJson);
          setCart(responseJson);
          setOrderInfo(prev => ({
            ...prev,
            cart: responseJson,
            client: {
              ...prev.client,
              name: getValues('client.name'),
              emailAddresses: [
                { emailAddress: getValues('client.emailAddresses[0].emailAddress') }
              ]
            }
          }));
        })
        .catch(e => console.warn('[MerchiSync] patchCart error:', e.response?.status || e));
      // Update localStorage with the patched cart data
      localStorage.setItem('MerchiCart', JSON.stringify(MERCHI.toJson(cartEnt)));

      // Comment out payment step for testing
      // const merchi_api_url = MERCHI_API_URL();
      // const response = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/${cartEnt.id()}/?cart_token=${cartEnt.token()}`);
      // const data = await response.json();
      // setStripeClientSecret(data.stripeClientSecret);
      // setCurrentStep('payment');

      const merchi_api_url = MERCHI_API_URL();
      const response = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/${cartEnt.id()}/?cart_token=${cartEnt.token()}`);
      const data = await response.json();
      setStripeClientSecret(data.stripeClientSecret);
      setCurrentStep('payment');

      // Directly proceed to order confirmation
      // window.location.href = '/checkout/order-confirmation';
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setOrderLoading(false);
    }
  }
  const handlePaymentSuccess = async (paymentIntent) => {

    try {
      //refetch the cart from the server
      // const cartEntrefetched = await getCart(cart.id, cart.token);
      // const cartJsonrefetched = MERCHI.toJson(cartEntrefetched);
      // localStorage.setItem('MerchiOrder', JSON.stringify(orderInfo));
      localStorage.setItem(
        'MerchiOrder',
        JSON.stringify({ ...orderInfo, cart })
      );

      // clear the cart after successful order placement
      localStorage.removeItem('MerchiCart');
      setCart({});

      // clear the minicart
      async function clearWooCart() {
        const nonce = await ensureWooNonce();

        const doClear = (n) =>
          fetch('/wp-json/wc/store/v1/cart/items', {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Nonce: n },
          });

        let res = await doClear(nonce);
        if (res.status === 403) res = await doClear(await fetchWooNonce());
        if (!res.ok) {
          console.warn('[Woo] empty-cart error:', res.status);
          return;
        }

        updateWooNonce(res);

        const emptyWooCart = await res.json();

        localStorage.storeApiCartData = JSON.stringify(emptyWooCart);
        sessionStorage.removeItem('wc/cart');

        const wpData = window.wp?.data;
        if (wpData) {
          wpData.dispatch('wc/store/cart')?.clearItems?.();
          wpData.dispatch('wc/store')?.clearCart?.();
        }
      }

      await clearWooCart();

      const merchi_api_url = MERCHI_API_URL();

      console.log('cart', cart);
      const completeResponse = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/complete/${cart.id}/?cart_token=${cart.token}`);
      const cartJsonrefetched = await completeResponse.json();
      console.log('paymentIntent', paymentIntent);
      console.log('cartJsonrefetched', cartJsonrefetched);

      // const cartJsonrefetched = MERCHI.toJson(data.cart);

      // Handle successful payment
      window.location.href = window.location.origin + '/thankyou?merchi_value=' + orderInfo.cart.totalCost + '&invoice_id=' + cartJsonrefetched.invoice.id + '&email=' + orderInfo.client.emailAddresses[0].emailAddress;

      //parameters merchi value, invoice id, email
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment error (show message, etc.)
  };


  return (
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
                          onChange={(e) => {
                            console.log('e', e);
                          }}
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

                      <div className="wc-block-components-text-input wc-block-components-address-form__phone">
                        <label htmlFor="client.phoneNumbers[0].phoneNumber" className="wc-block-components-text-input__label">Phone Number *</label>
                        <PhoneInput
                          country={country.toLowerCase()}
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
                            name: "client.phoneNumbers[0].phoneNumber",
                            required: true,
                            autoFocus: true
                          }}
                          onChange={(value, country) => {
                            setPhoneNumber(value);
                            setPhoneNumberCountry(country.countryCode.toUpperCase());
                          }}
                        />
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
                {/* <legend>Shipping Address</legend> */}
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
                setCart={setCart}
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
                    href="/cart/"
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
            <div className="payment-step">
              <button
                className='button wp-element-button'
                onClick={() => setCurrentStep('details')}
              >
                ← Back to Details
              </button>
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>
          )}
        </div>
        <WoocommerceCheckoutFormSideCart
          cart={cart}
          loading={shipmentOptionsLoading}
          isUpdatingShipping={isUpdatingShipping}
        />
      </div>
    </div>
  );
};

export default WoocommerceCheckoutForm;
