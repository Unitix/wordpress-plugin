var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var Role;
(function (Role) {
    Role[Role["PUBLIC"] = 0] = "PUBLIC";
    Role[Role["ADMIN"] = 1] = "ADMIN";
    Role[Role["SALES"] = 2] = "SALES";
    Role[Role["DESIGNER"] = 3] = "DESIGNER";
    Role[Role["SUPPLIER"] = 4] = "SUPPLIER";
    Role[Role["CLIENT"] = 5] = "CLIENT";
    Role[Role["MANAGER"] = 6] = "MANAGER";
    Role[Role["ACCOUNTANT"] = 7] = "ACCOUNTANT";
    Role[Role["THEME_EDITOR"] = 8] = "THEME_EDITOR";
})(Role || (Role = {}));
export var DOMAIN_MANAGERS = [Role.ADMIN, Role.MANAGER];
export var MANAGEMENT_TEAM = __spreadArray(__spreadArray([], __read(DOMAIN_MANAGERS), false), [
    Role.SALES,
    Role.DESIGNER,
    Role.ACCOUNTANT,
], false);
export var BUSINESS_ACCOUNTS = __spreadArray(__spreadArray([], __read(MANAGEMENT_TEAM), false), [Role.SUPPLIER], false);
export var MANAGEMENT_ROLES = [Role.ADMIN, Role.MANAGER];
export var THEME_ROLES = __spreadArray(__spreadArray([], __read(MANAGEMENT_ROLES), false), [Role.THEME_EDITOR], false);
export var ROLES_RANK = [
    Role.PUBLIC,
    Role.CLIENT,
    Role.ACCOUNTANT,
    Role.SALES,
    Role.DESIGNER,
    Role.SUPPLIER,
    Role.MANAGER,
    Role.ADMIN,
];
export var ALL_ROLES = ROLES_RANK;
