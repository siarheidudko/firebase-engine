"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageConverter = void 0;
/**
 * Storage File converter
 */
class StorageConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    static toString(d) {
        return d.toString("base64");
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    static fromString(d) {
        return Buffer.from(d, "base64");
    }
}
exports.StorageConverter = StorageConverter;
//# sourceMappingURL=StorageConverter.js.map