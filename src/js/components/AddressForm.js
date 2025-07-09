import React from 'react';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import useWooActive from '../utils';

const AddressForm = ({
  type = 'billing', // or 'shipping'
  register,
  errors,
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  setValue
}) => {
  useWooActive();
  const prefix = type === 'shipping' ? 'shipping' : 'billing';

  return (
    <div id={prefix} className="wc-block-components-address-form">
      {/* country */}
      <div className="wc-block-components-address-form__country wc-block-components-country-input">
        <div className="wc-blocks-components-select">
          <div className="wc-blocks-components-select__container">
            <label htmlFor={`${prefix}_country`} className="wc-blocks-components-select__label">Country / Region *</label>
            <CountryDropdown
              id={`${prefix}_country`}
              className="wc-blocks-components-select__select"
              valueType="short"
              onChange={(country) => {
                const iso = (country || '').toUpperCase();
                console.log('[AddressForm] Country selected ⇒', iso);
                setSelectedCountry(iso);
                setValue && setValue(`${prefix}_country`, iso);
              }}
              value={selectedCountry}
            />
            <input
              type="hidden"
              {...register(`${prefix}_country`, { required: 'Country is required' })}
            />
          </div>
        </div>
        {errors[`${prefix}_country`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_country`].message}</span>}
      </div>

      {/* address_1*/}
      <div className={`wc-block-components-text-input wc-block-components-address-form__address_1 
        ${errors[`${prefix}_address_1`] ? 'has-error' : ''}`}>
        <input
          type="text"
          id={`${prefix}_address_1`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_address_1`, { required: "Street address is required" })}
        />
        <label htmlFor={`${prefix}_address_1`} className="wc-block-components-text-input__label">House number and street name *</label>
        {errors[`${prefix}_address_1`] &&
          <div className="wc-block-components-validation-error" role="alert">
            <p id={`error-${prefix}-address_1`}>
              <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
              </svg>
              <span>{errors[`${prefix}_address_1`].message}</span>
            </p>
          </div>
        }
      </div>

      {/* address_2 */}
      <div className="wc-block-components-text-input wc-block-components-address-form__address_2">
        <label htmlFor={`${prefix}_address_2`} className="wc-block-components-text-input__label">Apartment, suite, unit, etc. (optional)</label>
        <input
          type="text"
          id={`${prefix}_address_2`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_address_2`)}
        />
      </div>

      {/* city */}
      <div className={`wc-block-components-text-input wc-block-components-address-form__city 
        ${errors[`${prefix}_city`] ? 'has-error' : ''}`}>
        <label htmlFor={`${prefix}_city`} className="wc-block-components-text-input__label">Town / City *</label>
        <input
          type="text"
          id={`${prefix}_city`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_city`, { required: "City is required" })}
        />
        {errors[`${prefix}_city`] &&
          <div className="wc-block-components-validation-error" role="alert">
            <p id={`error-${prefix}-city`}>
              <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
              </svg>
              <span>{errors[`${prefix}_city`].message}</span>
            </p>
          </div>
        }
      </div>

      {/* state */}
      <div className="wc-block-components-address-form__state wc-block-components-state-input">
        <div className="wc-blocks-components-select">
          <div className="wc-blocks-components-select__container">
            <label htmlFor={`${prefix}_state`} className="wc-blocks-components-select__label">State *</label>
            <RegionDropdown
              id={`${prefix}_state`}
              country={selectedCountry}
              valueType="short"
              className="wc-blocks-components-select__select"
              onChange={(state) => {
                setSelectedState(state);
              }}
              value={selectedState}
              countryValueType='short'
            />
          </div>
        </div>
        {errors[`${prefix}_state`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_state`].message}</span>}
      </div>

      {/* postcode */}
      <div className={`wc-block-components-text-input wc-block-components-address-form__postcode 
        ${errors[`${prefix}_postcode`] ? 'has-error' : ''}`}>
        <label htmlFor={`${prefix}_postcode`} className="wc-block-components-text-input__label">Postcode / ZIP *</label>
        <input
          type="text"
          id={`${prefix}_postcode`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_postcode`, { required: "Postcode is required" })}
        />
        {errors[`${prefix}_postcode`] &&
          <div className="wc-block-components-validation-error" role="alert">
            <p id={`error-${prefix}-postcode`}>
              <svg viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true">
                <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
              </svg>
              <span>{errors[`${prefix}_postcode`].message}</span>
            </p>
          </div>
        }
      </div>
    </div>
  );
};

export default AddressForm;
