"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthConverter = void 0;
/**
 * Auth Document converter
 */
let AuthConverter = /** @class */ (() => {
    class AuthConverter {
        /**
         * Convert an object to a string
         * @param d - Object for convert
         */
        static toString(d) {
            const obj = d.toJSON();
            const _obj = {};
            for (const key of AuthConverter.userField) {
                if (obj[key])
                    _obj[key] = obj[key];
            }
            return JSON.stringify(_obj);
        }
        /**
         * Convert string to object
         * @param d - String to convert
         */
        static fromString(d, restorePassword = false) {
            const _obj = JSON.parse(d);
            if (restorePassword) {
                if (_obj.passwordHash)
                    _obj.passwordHash = Buffer.from(_obj.passwordHash, "base64");
                if (_obj.passwordSalt)
                    _obj.passwordSalt = Buffer.from(_obj.passwordSalt, "base64");
            }
            else {
                if (_obj.passwordHash)
                    _obj.passwordHash = undefined;
                if (_obj.passwordSalt)
                    _obj.passwordSalt = undefined;
            }
            return _obj;
        }
    }
    /**
     * Copy only the allowed fields,
     * otherwise the object breaks
     * inside firebase.auth (after recovery)
     */
    AuthConverter.userField = [
        "customClaims",
        "disabled",
        "displayName",
        "email",
        "emailVerified",
        "metadata",
        "multiFactor",
        "passwordHash",
        "passwordSalt",
        "phoneNumber",
        "photoURL",
        "providerData",
        "tenantId",
        "uid",
    ];
    return AuthConverter;
})();
exports.AuthConverter = AuthConverter;
//# sourceMappingURL=AuthConverter.js.map