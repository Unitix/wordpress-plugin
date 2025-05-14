# Merchi Checkout

A customizable checkout step form component for Merchi e-commerce platform.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Props](#props)
  - [Style Classes](#style-classes)
  - [State Props](#state-props)
  - [State Modifiers](#state-modifiers)
  - [Function Props](#function-props)
  - [Configuration Props](#configuration-props)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
# Using npm
npm install merchi_checkout

# Using yarn
yarn add merchi_checkout
```

## Usage

```jsx
import { MerchiCheckout } from 'merchi_checkout';

function App() {
  return (
    <MerchiCheckout
      invoice={invoiceData}
      product={productData}
      currentUser={userData}
      toggleMerchiCheckout={() => {}}
      isOpen={true}
    />
  );
}
```

## Features

- Customizable checkout flow
- Support for discount codes
- Google Places integration for address autocomplete
- Multiple payment gateway support
- Quote request functionality
- Domain signup integration
- Customizable styling through className props
- Responsive design
- Invoice generation and management

## Props

### Style Classes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `classNameMerchiCheckoutAlertsContainer` | `string?` | `"d-flex justify-content-center flex-column alerts-container-sm"` | Class for the alerts container |
| `classNameMerchiCheckoutAlert` | `string?` | `"alert alert-dismissible alert-notify"` | Class for the alert element |
| `classNameMerchiCheckoutAlertError` | `string?` | `"alert-danger"` | Class for the danger/error alert |
| `classNameMerchiCheckoutAlertSuccess` | `string?` | `"alert-success"` | Class for the success alert |
| `classNameMerchiCheckoutButtonPrimary` | `string?` | `"btn btn-md btn-primary d-flex align-items-center justify-content-center"` | Class for the primary button |
| `classNameMerchiCheckoutButtonPrimaryBlock` | `string?` | `"btn btn-lg btn-primary btn-block"` | Class for the primary block button |
| `classNameMerchiCheckoutButtonSecondary` | `string?` | `"btn btn-lg btn-secondary"` | Class for the secondary button |
| `classNameMerchiCheckoutButtonSecondaryBlock` | `string?` | `"btn btn-lg btn-secondary btn-block"` | Class for the secondary block button |
| `classNameMerchiCheckoutButtonDownloadInvoice` | `string?` | `"btn btn-lg btn-primary"` | Class for the download invoice button |
| `classNameMerchiCheckoutFormCheckbox` | `string?` | `"form-check-input"` | Class for input checkbox or radio |
| `classNameMerchiCheckoutFormGroup` | `string?` | `"form-group"` | Class for the form group: label, input, checkbox, radio... |
| `classNameMerchiCheckoutFormGroupCheckbox` | `string?` | `"form-check"` | Class for the checkbox/radio container |
| `classNameMerchiCheckoutFormInput` | `string?` | `"form-control"` | Class for input fields |
| `classNameMerchiCheckoutGoogleSuggestList` | `string?` | `"list-group m-b-0"` | Class for a list group |
| `classNameMerchiCheckoutGoogleSuggestListItem` | `string?` | `"list-group-item cursor-pointer"` | Class for the list item geo suggest |
| `classNameMerchiCheckoutListGroupItemLoader` | `string?` | `"list-group-item modal-merchi-checkout-shipment-option"` | Class for the list item loader |
| `classNameMerchiCheckoutFormLabelCheckbox` | `string?` | None | Class for the checkbox/radio label |
| `classNameMerchiCheckoutInputError` | `string?` | `"text-danger"` | Class for the input error |
| `classNameMerchiCheckoutListGroup` | `string?` | `"modal-merchi-checkout-shipment-option"` | Class for the checkout list group |
| `classNameMerchiCheckoutListGroupItem` | `string?` | `"list-group-item"` | Class for the checkout list group item |
| `classNameMerchiCheckoutRow` | `string?` | `"merchi-row"` | Class for a row element |
| `classNameMerchiCheckoutRowColumn` | `string?` | `"merchi-column"` | Class for a column element |
| `classNameMerchiCheckoutTabsContainer` | `string?` | `"merchi-checkout-tabs-container"` | Class for the tabs container |
| `classNameMerchiCheckoutTab` | `string?` | `"merchi-checkout-tab"` | Class for the checkout tab element |
| `classNameMerchiCheckoutTabPane` | `string?` | `"tab-pane"` | Class for the tab pane |
| `classNameMerchiCheckoutTabPaneButton` | `string?` | `"btn merchi-checkout-tab-btn"` | Class for the tab pane button |
| `classNameMerchiCheckoutTabPaneContainer` | `string?` | `"tab-content"` | Class for the tab content |
| `classNameMerchiCheckoutTabButton` | `string?` | `"btn merchi-checkout-tab-btn"` | Class for the merchi checkout tab button |
| `classNameMerchiInvoiceButtonPayInvoice` | `string?` | `"btn btn-lg btn-primary btn-block"` | Class for the invoice pay button |
| `discountClassName` | `string?` | `'merchi-checkout-discount-code-container'` | Class for the discount container |
| `discountClassNameMainContainer` | `string?` | None | Class for the discount main container |
| `discountClassNameButtonItemRemove` | `string?` | `'btn btn-sm btn-link'` | Class for the discount button to remove an item |
| `discountClassNameButton` | `string?` | `'btn btn-primary'` | Class for the discount button |
| `discountClassNameButtonContainer` | `string?` | `''` | Class for the discount button container |
| `discountClassNameErrorMessage` | `string?` | `'text-danger'` | Class for the discount error message |
| `discountClassNameInput` | `string?` | `'form-control'` | Class for the discount input |
| `discountClassNameListItem` | `string?` | `'list-group-item d-flex align-items-center justify-content-between mt-2'` | Class for the discount list item |
| `discountClassNameListItems` | `string?` | `'list-group'` | Class for the discount list items |
| `discountClassNameInputContainer` | `string?` | `'merchi-checkout-discount-code-field-container'` | Class for the discount input container |
| `discountClassNameInputdiscountLabel` | `string?` | `'visually-hidden'` | Class for the discount label |

### State Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `currentUser` | `MerchiUserJson?` | None | Merchi user entity |
| `invoice` | `MerchiInvoiceJson?` | None | A Merchi invoice json object |
| `job` | `MerchiJobJson?` | None | A Merchi job json object |
| `product` | `MerchiProductJson?` | None | A Merchi product json object |
| `isOpen` | `boolean?` | None | Used if the checkout is active |
| `isBuyRequest` | `boolean?` | None | Tells the checkout to display payment gateway |
| `isProductEmbedForm` | `boolean?` | `false` | Tells the checkout that it's a child of the Product embed form |

### State Modifiers

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `includeDomainSignup` | `boolean?` | `false` | Tells the checkout to hide the domain sign up tab |
| `showUserTermsAndConditions` | `boolean?` | `true` | Show user terms and conditions |
| `showDiscountCode` | `boolean?` | `true` | Show the discount code UI on the confirm tab |
| `discountShowAppliedItems` | `boolean?` | `false` | Show the applied discount items |
| `redirectWithValue` | `boolean?` | `true` | On redirect the value of the sale will be appended onto the redirect URLs |

### Function Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `setInvoice` | `(i: MerchiInvoiceJson) => void?` | None | A setter function for the Merchi invoice |
| `setJob` | `(j: MerchiJobJson) => void?` | None | A setter function for the Merchi job |
| `toggleMerchiCheckout` | `() => void` | None | A toggle function which sets the "isOpen" prop |

### Configuration Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `googlePlacesApiKey` | `string?` | None | API key for Google places |
| `urlApi` | `string?` | `'https://api.merchi.co/v6/'` | URL to connect to the Merchi API |
| `urlFrontend` | `string?` | `'https://merchi.co/'` | URL to redirect users to a frontend |
| `redirectAfterSuccessUrl` | `string?` | None | On checkout or job creation this url will be redirected to. Typically used for third party conversion tracking |
| `redirectAfterQuoteSuccessUrl` | `string?` | None | On checkout or job creation "quote request", this url will be redirected to. Typically used for third party conversion tracking |
| `messageSuccessBuyRequest` | `string?` | None | A success message shown on completion of a buy request |
| `messageSuccessQuoteRequest` | `string?` | None | A success message shown on completion of a quote request |
| `discountButtonText` | `string?` | None | Text for the discount button |
| `discountLabel` | `string?` | `'Discount code'` | Label for the discount input |

## Examples

### Basic Usage
```jsx
import { MerchiCheckout } from 'merchi_checkout';

function BasicCheckout() {
  return (
    <MerchiCheckout
      invoice={invoiceData}
      product={productData}
      isOpen={true}
      toggleMerchiCheckout={() => {}}
    />
  );
}
```

### With Google Places Integration
```jsx
import { MerchiCheckout } from 'merchi_checkout';

function CheckoutWithGooglePlaces() {
  return (
    <MerchiCheckout
      invoice={invoiceData}
      product={productData}
      isOpen={true}
      toggleMerchiCheckout={() => {}}
      googlePlacesApiKey="YOUR_GOOGLE_PLACES_API_KEY"
    />
  );
}
```

### With Custom Styling
```jsx
import { MerchiCheckout } from 'merchi_checkout';

function CustomStyledCheckout() {
  return (
    <MerchiCheckout
      invoice={invoiceData}
      product={productData}
      isOpen={true}
      toggleMerchiCheckout={() => {}}
      classNameMerchiCheckoutButtonPrimary="custom-primary-button"
      classNameMerchiCheckoutFormInput="custom-input"
    />
  );
}
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
