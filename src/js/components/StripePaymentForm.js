import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// The actual form component that contains the Stripe elements
const PaymentForm = ({ onPaymentSuccess, onPaymentError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  // const orderConfirmationUrl = `${window.location.origin}/thankyou`;
  const orderConfirmationUrl = window.scriptData?.checkoutUrl
    ? window.scriptData.checkoutUrl.replace(/\/checkout\/?$/, '/thankyou')
    : `${window.location.origin}/thankyou`;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: orderConfirmationUrl,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message);
        onPaymentError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
      onPaymentError(err);
      // } finally {
      //   setIsProcessing(false);
    }
  };

  return (
    <>
      {isProcessing && (
        <div className="payment-overlay" role="alert" aria-live="assertive">
          <span
            className="wc-block-components-spinner is-active payment-spinner"
            aria-hidden="true"
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="stripe-payment-form">
        <PaymentElement />
        {errorMessage && (
          <div className="stripe-error-message">
            {errorMessage}
          </div>
        )}
        <div className="payment-actions">
          <button
            type="button"
            className="button wp-element-button is-secondary back-btn"
            onClick={onBack}
          >
            ← Back to Details
          </button>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="button wp-element-button pay-btn"
          >
            {isProcessing ? 'Processing…' : 'Pay Now'}
          </button>
        </div>
      </form>
    </>
  );
};

// The wrapper component that initializes Stripe
const StripePaymentForm = ({ clientSecret, onPaymentSuccess, onPaymentError, onBack }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Initialize Stripe with your publishable key
    const initializeStripe = async () => {
      const stripe = await loadStripe(scriptData.merchi_stripe_api_key);
      setStripePromise(stripe);
    };

    initializeStripe();
  }, []);

  if (!stripePromise || !clientSecret) {
    return <div>Loading payment form...</div>;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };

  return (
    <div className="stripe-payment-wrapper">
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
};

export default StripePaymentForm;
