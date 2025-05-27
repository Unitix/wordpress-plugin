import React from 'react';
import { CountrySelect, StateSelect } from 'react-country-state-city';

const AddressForm = ({
  type = 'billing', // or 'shipping'
  register,
  errors,
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState
}) => {
  const prefix = type === 'shipping' ? 'shipping' : 'billing';

  return (
    <div className={`${prefix}-details`}>
      <div className="form-row">
        <label htmlFor={`${prefix}_country`}>Country / Region *</label>
        <CountrySelect
          id={`${prefix}_country`}
          className="select form-control"
          defaultValue={selectedCountry}
          onChange={(country) => {
            setSelectedCountry(country);
          }}
          placeHolder="Select Country"
        />
        {errors[`${prefix}_country`] && 
          <span className="error">{errors[`${prefix}_country`].message}</span>}
      </div>

      <div className="form-row">
        <label htmlFor={`${prefix}_address_1`}>Street Address *</label>
        <input
          type="text"
          id={`${prefix}_address_1`}
          className="input-text form-control"
          placeholder="House number and street name"
          {...register(`${prefix}_address_1`, { required: "Street address is required" })}
        />
        {errors[`${prefix}_address_1`] && 
          <span className="error">{errors[`${prefix}_address_1`].message}</span>}
      </div>

      <div className="form-row">
        <input
          type="text"
          id={`${prefix}_address_2`}
          className="input-text form-control"
          placeholder="Apartment, suite, unit, etc. (optional)"
          {...register(`${prefix}_address_2`)}
        />
      </div>

      <div className="form-row">
        <label htmlFor={`${prefix}_city`}>Town / City *</label>
        <input
          type="text"
          id={`${prefix}_city`}
          className="input-text form-control"
          {...register(`${prefix}_city`, { required: "City is required" })}
        />
        {errors[`${prefix}_city`] && 
          <span className="error">{errors[`${prefix}_city`].message}</span>}
      </div>

      <div className="form-row">
        <label htmlFor={`${prefix}_state`}>State *</label>
        <StateSelect
          id={`${prefix}_state`}
          countryid={selectedCountry?.id}
          className="select form-control"
          onChange={(state) => {
            setSelectedState(state);
          }}
          placeHolder="Select State"
          defaultValue={selectedState}
        />
        {errors[`${prefix}_state`] && 
          <span className="error">{errors[`${prefix}_state`].message}</span>}
      </div>

      <div className="form-row">
        <label htmlFor={`${prefix}_postcode`}>Postcode / ZIP *</label>
        <input
          type="text"
          id={`${prefix}_postcode`}
          className="input-text form-control"
          {...register(`${prefix}_postcode`, { required: "Postcode is required" })}
        />
        {errors[`${prefix}_postcode`] && 
          <span className="error">{errors[`${prefix}_postcode`].message}</span>}
      </div>
    </div>
  );
};

export default AddressForm;
