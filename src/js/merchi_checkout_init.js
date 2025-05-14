import React from 'react';
import ReactDOM from 'react-dom';
import CheckoutWrapper from './components/CheckoutWrapper';
import { backendUri, stagingBackendUri } from './utils';

export function initializeCheckout(product, job) {
  const container = document.getElementById('merchi-checkout-container');
  if (!container) {
    console.error('Checkout container not found');
    return;
  }

  const apiUrl = window.merchiConfig.stagingMode
    ? stagingBackendUri
    : backendUri;

  ReactDOM.render(
    <CheckoutWrapper config={{
      apiUrl,
      product,
      job
    }} />,
    container
  );
}
