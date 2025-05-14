export var DomainType;
(function (DomainType) {
    DomainType[DomainType["UNRESTRICTED"] = 0] = "UNRESTRICTED";
    DomainType[DomainType["SELLER"] = 1] = "SELLER";
    DomainType[DomainType["SELLER_PLUS"] = 2] = "SELLER_PLUS";
    DomainType[DomainType["SUPPLIER"] = 3] = "SUPPLIER";
    DomainType[DomainType["RESTRICTED_SUPPLIER"] = 4] = "RESTRICTED_SUPPLIER";
    DomainType[DomainType["DOMAIN_SUPPLIER"] = 5] = "DOMAIN_SUPPLIER";
    DomainType[DomainType["DOMAIN_CLIENT_CATALOGUE"] = 6] = "DOMAIN_CLIENT_CATALOGUE";
    DomainType[DomainType["DOMAIN_SHOPIFY_SELLER"] = 7] = "DOMAIN_SHOPIFY_SELLER";
    DomainType[DomainType["UNRESTRICTED_SHOPIFY_APP"] = 8] = "UNRESTRICTED_SHOPIFY_APP";
    DomainType[DomainType["RESERVED"] = 9] = "RESERVED";
})(DomainType || (DomainType = {}));
