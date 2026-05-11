import React from 'react';
import { createRoot } from 'react-dom/client';
import WoocommerceCheckoutForm from './components/WoocommerceCheckoutForm';
import WoocommerceCartForm from './components/WoocommerceCartForm';
import OrderConfirmation from './components/OrderConfirmation';
import { CartProvider } from './contexts/CartContext';
import { cartPageEmbed } from './utils';

// Initialize React component when the document is ready
document.addEventListener('DOMContentLoaded', function () {
  const cartFormContainer = document.getElementById('woocommerce-cart-form');
  if (cartFormContainer) {
    const root = createRoot(cartFormContainer);
    root.render(
      <CartProvider embed={cartPageEmbed}>
        <WoocommerceCartForm />
      </CartProvider>
    );
  }

  const checkoutFormContainer = document.getElementById('woocommerce-checkout-form');
  if (checkoutFormContainer) {
    const root = createRoot(checkoutFormContainer);
    root.render(
      <CartProvider>
        <WoocommerceCheckoutForm />
      </CartProvider>
    );
  }

  const orderConfirmationContainer = document.getElementById('order-confirmation-root');
  if (orderConfirmationContainer) {
    const root = createRoot(orderConfirmationContainer);
    root.render(
      <CartProvider>
        <OrderConfirmation />
      </CartProvider>
    );
  }
});
