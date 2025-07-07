import React, { useEffect } from 'react';
import MerchiCheckout from 'merchi_checkout';

// Modal component that can be opened/closed
const CheckoutModal = ({ apiUrl, isOpen, setIsOpen, job, setJob, product }) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const onClose = () => setIsOpen(false);
  return (
    <div className="merchi-modal-overlay" onClick={onClose}>
      <div className="merchi-modal-content" onClick={e => e.stopPropagation()}>
        <button className="merchi-modal-close" onClick={onClose}>×</button>
        <div className="merchi-modal-header">
          <h2 className="merchi-modal-title">Request a Quote</h2>
        </div>
        <MerchiCheckout
          classNameMerchiCheckoutButtonPrimary='button wp-element-button'
          classNameMerchiCheckoutButtonPrimaryBlock='button wp-element-button'
          classNameMerchiCheckoutButtonSecondary='button alt wp-element-button'
          classNameMerchiCheckoutButtonSecondaryBlock='button alt wp-element-button'
          classNameMerchiCheckoutFooterActionsContainer='merchi-checkout-footer-actions-container'
          classNameMerchiCheckoutConfirmInfoPanel='merchi-checkout-confirm-info-panel'
          classNameMerchiCheckoutFormGroup='form-row'
          classNameMerchiCheckoutFormInput='input-text form-control'
          classNameMerchiCheckoutFormSelect='select form-control'
          discountClassNameButton='button wp-element-button'
          discountClassNameInput='input-text form-control'
          discountClassNameButtonItemRemove='button wp-element-button'
          urlApi={apiUrl}
          isOpen={isOpen}
          toggleMerchiCheckout={onClose}
          job={job}
          product={product}
          setJob={setJob}
        />
      </div>
    </div>
  );
};

export default CheckoutModal;
