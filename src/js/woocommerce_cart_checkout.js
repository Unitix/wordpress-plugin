import React from 'react';
import { createRoot } from 'react-dom/client';
import WoocommerceCheckoutForm from './components/WoocommerceCheckoutForm';
import WoocommerceCartForm from './components/WoocommerceCartForm';

// Initialize React component when the document is ready
document.addEventListener('DOMContentLoaded', function () {
  const checkoutFormContainer = document.getElementById('woocommerce-checkout-form');
  if (checkoutFormContainer) {
    const root = createRoot(checkoutFormContainer);
    root.render(<WoocommerceCheckoutForm />);
  }

  const cartFormContainer = document.getElementById('woocommerce-cart-form');
  if (cartFormContainer) {
    const root = createRoot(cartFormContainer);
    root.render(<WoocommerceCartForm />);
  }
});
