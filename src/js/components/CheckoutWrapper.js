import React, { useState } from 'react';
import MerchiCheckout from 'merchi_checkout';

const CheckoutWrapper = ({ config }) => {
  const {job: defaultJob, product} = config;
  const [isOpen, setIsOpen] = useState(false);
  const [job, setJob] = useState({...defaultJob});

  // Function to toggle checkout visibility
  const toggleCheckout = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="merchi-checkout-wrapper">
      <button 
        className="merchi-checkout-toggle"
        onClick={toggleCheckout}
      >
        {isOpen ? 'Close Checkout' : 'Open Checkout'}
      </button>
      
      {isOpen && (
        <MerchiCheckout
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          job={job}
          product={product}
          setJob={setJob}
        />
      )}
    </div>
  );
};

export default CheckoutWrapper;
