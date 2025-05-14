export var UserType;
(function (UserType) {
    UserType[UserType["PUBLIC"] = 0] = "PUBLIC";
    UserType[UserType["CLIENT_GUEST"] = 1] = "CLIENT_GUEST";
    UserType[UserType["CLIENT_DOMAIN"] = 2] = "CLIENT_DOMAIN";
    UserType[UserType["CLIENT_MULTIPLE_DOMAINS"] = 3] = "CLIENT_MULTIPLE_DOMAINS";
    UserType[UserType["CLIENT_MERCHI"] = 4] = "CLIENT_MERCHI";
    UserType[UserType["SELLER_FREE_MERCHI"] = 5] = "SELLER_FREE_MERCHI";
    UserType[UserType["SELLER_FREE_DOMAIN"] = 6] = "SELLER_FREE_DOMAIN";
    UserType[UserType["SELLER_PAID"] = 7] = "SELLER_PAID";
    UserType[UserType["SELLER_PAID_MULTIPLE_DOMAINS"] = 8] = "SELLER_PAID_MULTIPLE_DOMAINS";
    UserType[UserType["SUPPLIER_THIRD_PARTY"] = 9] = "SUPPLIER_THIRD_PARTY";
    UserType[UserType["SUPPLIER_RESTRICTED"] = 10] = "SUPPLIER_RESTRICTED";
    UserType[UserType["SUPPLIER_MERCHI"] = 11] = "SUPPLIER_MERCHI";
    UserType[UserType["UNRESTRICTED"] = 12] = "UNRESTRICTED";
    UserType[UserType["SHOPIFY_REFERENCE"] = 13] = "SHOPIFY_REFERENCE";
    UserType[UserType["RESERVED_FROM_SOCIAL"] = 14] = "RESERVED_FROM_SOCIAL";
})(UserType || (UserType = {}));
