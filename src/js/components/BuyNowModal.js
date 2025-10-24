import React, { useEffect, useState } from 'react';
import MerchiCheckout from 'merchi_checkout';

// Buy Now Modal component
const BuyNowModal = ({ apiUrl, isOpen, setIsOpen, job, setJob, product }) => {
  const [invoice, setInvoice] = useState(null);

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

  const onClose = () => {
    setIsOpen(false);
    setInvoice(null);
  };

  return (
    <div className="merchi-modal-overlay" onClick={onClose}>
      <div className="merchi-modal-content" onClick={e => e.stopPropagation()}>
        <button className="merchi-modal-close" onClick={onClose}>×</button>
        <div className="merchi-modal-header">
          <h2 className="merchi-modal-title">Buy Now</h2>
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
          isBuyRequest={true}
          toggleMerchiCheckout={onClose}
          job={job}
          product={product}
          setJob={setJob}
          invoice={invoice}
          setInvoice={setInvoice}
          messageSuccessBuyRequest="Thank you! Your order has been received and payment processed successfully."
          // redirectAfterSuccessUrl={window.scriptData?.shopUrl}
        />
      </div>
    </div>
  );
};

export default BuyNowModal;
