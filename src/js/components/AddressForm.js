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
  setSelectedState
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
              value={selectedCountry ?? ''}
              onChange={(country) => {
                setSelectedCountry(country);
              }}
            />
          </div>
        </div>
        {errors[`${prefix}_country`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_country`].message}</span>}
      </div>

      {/* address_1*/}
      <div className="wc-block-components-text-input wc-block-components-address-form__address_1">
        <input
          type="text"
          id={`${prefix}_address_1`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_address_1`, { required: "Street address is required" })}
        />
        <label htmlFor={`${prefix}_address_1`} className="wc-block-components-text-input__label">House number and street name *</label>
        {errors[`${prefix}_address_1`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_address_1`].message}</span>}
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
      <div className="wc-block-components-text-input wc-block-components-address-form__city">
        <label htmlFor={`${prefix}_city`} className="wc-block-components-text-input__label">Town / City *</label>
        <input
          type="text"
          id={`${prefix}_city`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_city`, { required: "City is required" })}
        />
        {errors[`${prefix}_city`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_city`].message}</span>}
      </div>

      {/* state */}
      <div className="wc-block-components-address-form__state wc-block-components-state-input">
        <div className="wc-blocks-components-select">
          <div className="wc-blocks-components-select__container">
            <label htmlFor={`${prefix}_state`} className="wc-blocks-components-select__label">State *</label>
            <RegionDropdown
              id={`${prefix}_state`}
              country={selectedCountry}
              className="wc-blocks-components-select__select"
              onChange={(state) => {
                setSelectedState(state);
              }}
              defaultValue={selectedState}
            />
          </div>
        </div>
        {errors[`${prefix}_state`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_state`].message}</span>}
      </div>

      {/* postcode */}
      <div className="wc-block-components-text-input wc-block-components-address-form__postcode">
        <label htmlFor={`${prefix}_postcode`} className="wc-block-components-text-input__label">Postcode / ZIP *</label>
        <input
          type="text"
          id={`${prefix}_postcode`}
          className="wc-block-components-text-input__input"
          {...register(`${prefix}_postcode`, { required: "Postcode is required" })}
        />
        {errors[`${prefix}_postcode`] &&
          <span className="wc-block-components-validation-error">{errors[`${prefix}_postcode`].message}</span>}
      </div>
    </div>
  );
};

export default AddressForm;
