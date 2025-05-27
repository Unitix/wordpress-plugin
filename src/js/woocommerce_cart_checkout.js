import React from 'react';
import { createRoot } from 'react-dom/client';
import WoocommerceCheckoutForm from './components/WoocommerceCheckoutForm';

// Initialize React component when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  const checkoutFormContainer = document.getElementById('woocommerce-checkout-form');
  if (checkoutFormContainer) {
    const root = createRoot(checkoutFormContainer);
    root.render(<WoocommerceCheckoutForm />);
  }
});
