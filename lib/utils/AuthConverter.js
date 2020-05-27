"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthConverter = void 0;
/**
 * Auth Document converter
 */
class AuthConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    static toString(d) {
        const _obj = d.toJSON();
        return JSON.stringify(_obj);
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    static fromString(d) {
        const _obj = JSON.parse(d);
        return _obj;
    }
}
exports.AuthConverter = AuthConverter;
//# sourceMappingURL=AuthConverter.js.map