export var PaymentType;
(function (PaymentType) {
    PaymentType[PaymentType["ONLINE_PAYMENT"] = 1] = "ONLINE_PAYMENT";
    PaymentType[PaymentType["PAYPAL_PAYMENT"] = 2] = "PAYPAL_PAYMENT";
    PaymentType[PaymentType["BANK_TRANSFER"] = 3] = "BANK_TRANSFER";
    PaymentType[PaymentType["CASH"] = 4] = "CASH";
    PaymentType[PaymentType["CHEQUE"] = 5] = "CHEQUE";
    PaymentType[PaymentType["PHONE_PAYMENT"] = 6] = "PHONE_PAYMENT";
    PaymentType[PaymentType["CREDIT_CARD"] = 7] = "CREDIT_CARD";
    PaymentType[PaymentType["UTRUST_PAYMENT"] = 8] = "UTRUST_PAYMENT";
})(PaymentType || (PaymentType = {}));
