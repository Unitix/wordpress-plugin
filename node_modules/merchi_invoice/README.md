# merchi_invoice
Merchi Invoice
# merchi_checkout
Merchi's invoice component


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)

## Installation

```bash
npm install merchi_invoice

or

yarn add merchi_invoice
```

### Props

| Name                                          | Type                             | Default                            | Description                                                         |
|-----------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------|
| `alertErrorShow`                              | `(message: string) => void?`     | `console.error`                    | `A callback function for errors`                                    |
| `classNameMerchiInvoiceButtonDownloadInvoice` | `string?`                        | `btn btn-lg btn-primary`           | `A class for the download invoice button`                           |
| `classNameMerchiInvoiceButtonPayInvoice`      | `string?`                        | `btn btn-lg btn-primary btn-block` | `A class for the invoice payment button`                            |
| `callbackCreditCardPaymentSuccess`            | `(invoiceJson: any) => void;?`   | `console.log`                      | `A callback function which returns invoice json on payment success` |
| `invoice`                                     | `merchiInvoice json?`            | `{}`                               | `The merchi invoice entity as json`                                 |
| `urlApi`                                      | `string?`                        | `https://api.merchi.co/v6/`        | `Url to connect to the api`                                         |
