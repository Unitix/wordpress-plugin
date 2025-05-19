import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import CheckoutModal from './components/CheckoutModal';
import { backendUri, stagingBackendUri } from './utils';

// Main checkout component that manages the modal state
const MerchiCheckout = React.forwardRef((props, ref) => {
  const { product } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [job, setJob] = useState({...props.job});
  
  // Expose methods through ref
  window.toggleMerchiCheckout = (jobDataFromForm = {}) => {
    setJob({...jobDataFromForm});
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (ref) {
      ref.current = {
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false)
      };
    }
  }, [ref]);

  const apiUrl = window.merchiConfig.stagingMode
    ? stagingBackendUri
    : backendUri;

  console.log(apiUrl, 'what is the api url here?>');
  return (
    <CheckoutModal
      apiUrl={`${apiUrl}v6/`}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      product={product}
      job={job}
      setJob={setJob}
    />
  );
});

// Initialize the checkout - now returns a ref for controlling the modal
export function initializeCheckout(product, job) {
  // Get or create the container
  let container = document.getElementById('merchi-checkout-container');
  
  // If container doesn't exist, create it
  if (!container) {
    container = document.createElement('div');
    container.id = 'merchi-checkout-container';
    document.body.appendChild(container);
  }

  // Create a ref to access the component's methods
  const checkoutRef = React.createRef();
  
  // Render the component
  ReactDOM.render(
    <MerchiCheckout
      ref={checkoutRef}
      product={product}
      job={job}
    />,
    container
  );

  // Return the ref so external code can call openModal/closeModal
  return checkoutRef.current;
}
