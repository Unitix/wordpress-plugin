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

async function createClient(MERCHI, clientJson, cartJson) {
  return new Promise((resolve, reject) => {
    const { domain = {} } = cartJson;
    const registeredUnderDomains = domain?.id
      ? [{id: domain.id}]
      : undefined;
    
    const clientEnt = MERCHI.fromJson(
      new MERCHI.Client(),
      {... clientJson, registeredUnderDomains}
    );
    
    const data = serialise(clientEnt, null, null, null, {excludeOld: false})[0];
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
  const [cart, setCart] = useState(localCart);
  const { domain = {} } = cart;
  const { country = 'AU' } = domain;
  
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
    const cartJson = {...cart, receiverAddress: {...cart.receiverAddress, country: c, state: s}};
    try {
      const cartEnt = await patchCart(cartJson);
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

    let cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cart);
    try {
      // try update or create new client
      if (!cart?.client?.id || cart?.emailAddresses[0]?.emaillAddress !== client?.emailAddesses[0]?.emailAddress) {
        const newCartClient = await createClient(
          MERCHI,
          {
            name: client.name,
            emailAddresses: [{emailAddress: client.emailAddresses[0].emailAddress}],
            phoneNumbers: [{code: phoneNumberCountry, number: phoneNumber}],
          },
          cart
        );
        cartEnt.client(newCartClient);
      }
      const addressEnt = new MERCHI.Address()
        .lineOne(shipping_address_1)
        .lineTwo(shipping_address_2)
        .city(shipping_city)
        .postcode(shipping_postcode)
        .country(selectedShippingCountry?.iso2)
        .state(selectedShippingState?.iso2);
      cartEnt.receiverAddress(addressEnt);
      cartEnt = await patchCart(cartEnt);

      const merchi_api_url = MERCHI_API_URL();
      // Get Stripe client secret
      const response = await fetch(`${merchi_api_url}v6/stripe/payment_intent/cart/${cartEnt.id()}/?cart_token=${cartEnt.token()}`);
      const data = await response.json();
      setStripeClientSecret(data.stripeClientSecret);
      setCurrentStep('payment');
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setOrderLoading(false);
    }
  }

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Handle successful payment
      window.location.href = '/checkout/order-confirmation';
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment error (show message, etc.)
  };

  return (
    <div className='wc-block-components-sidebar-layout wc-block-checkout is-large'>
      {/* <WoocommerceCheckoutFormSideCart /> */}
      <div className="wc-block-components-main wc-block-checkout__main wp-block-woocommerce-checkout-fields-block">
        {currentStep === 'details' ? (
          <form onSubmit={handleSubmit(placeOrder)}>
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
                    <div className="form-row">
                      <label htmlFor="billing_first_name">Full Name *</label>
                      <input
                        type="text"
                        id="billing_first_name"
                        placeholder="John Smith"
                        className="input-text form-control"
                        {...register("cart.client.name", { required: "First name is required" })}
                      />
                      {errors.billing_first_name && 
                        <span className="error">{errors.billing_first_name.message}</span>}
                    </div>

                    <div className="form-row">
                      <label htmlFor="client.emailAddresses[0].emailAddress">Email Address *</label>
                      <input
                        type="email"
                        id="billing_email"
                        className="input-text form-control"
                        placeholder="example@example.com"
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
                      {errors.billing_email && 
                        <span className="error">{errors.billing_email.message}</span>}
                    </div>

                    <div className="form-row">
                      <label htmlFor="client.phoneNumbers[0].phoneNumber">Phone Number *</label>
                      <PhoneInput
                        country={country.toLowerCase()}
                        inputClass="input-text form-control"
                        containerClass="form-row"
                        inputStyle={{ width: '100%' }}
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

            <fieldset className="wc-block-checkout__billing-fields">
              <legend>Shipping Address</legend>
              <AddressForm
                type="shipping"
                register={register}
                errors={errors}
                selectedCountry={selectedShippingCountry}
                setSelectedCountry={setSelectedShippingCountry}
                selectedState={selectedShippingState}
                setSelectedState={setSelectedShippingState}
              />
            </fieldset>

            <ShippingOptions
              shipmentGroups={shipmentGroups}
              shipmentOptionsLoading={shipmentOptionsLoading}
            />

            <div className="form-row">
              <label htmlFor="order_notes">Order Notes (optional)</label>
              <textarea
                id="order_notes"
                className="wc-block-components-textarea"
                placeholder="Notes about your order, e.g. special notes for delivery"
                {...register("order_notes")}
              ></textarea>
            </div>

            <div className="form-submit">
              <button 
                type="submit" 
                className='button wp-element-button'
                disabled={orderLoading}
              >
                {orderLoading ? 'Processing...' : 'Continue to Payment'}
              </button>
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
    </div>
  );
};

export default WoocommerceCheckoutForm;
