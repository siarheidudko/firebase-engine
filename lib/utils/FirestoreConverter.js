"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreConverter = void 0;
const firebase_admin_1 = require("firebase-admin");
/**
 * Firestore Document converter
 */
class FirestoreConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    static toString(d) {
        const _obj = FirestoreConverter.toObject(d);
        return JSON.stringify(_obj);
    }
    /**
     * Internal deserialization
     * @param d - Object for deserialization
     */
    static toObject(d) {
        if (typeof (d) === "string")
            return { data: d, type: "string" };
        if (typeof (d) === "number")
            return { data: d, type: "number" };
        if (typeof (d) === "boolean")
            return { data: d, type: "boolean" };
        if (d === null)
            return { data: d, type: "null" };
        if (d instanceof firebase_admin_1.firestore.Timestamp)
            return { data: d.toMillis(), type: "timestamp" };
        if (d instanceof firebase_admin_1.firestore.DocumentReference)
            return { data: d.path, type: "document" };
        if (d instanceof firebase_admin_1.firestore.GeoPoint)
            return { data: { lat: d.latitude, long: d.longitude }, type: "geopoint" };
        if (Array.isArray(d)) {
            const _arr = { data: [], type: "array" };
            for (const val of d)
                _arr.data.push(FirestoreConverter.toObject(val));
            return _arr;
        }
        const clearObject = {};
        if (d.__proto__ === clearObject.__proto__) {
            const _obj = { data: {}, type: "map" };
            for (const key in d)
                _obj.data[key] = FirestoreConverter.toObject(d[key]);
            return _obj;
        }
        return { data: JSON.stringify(d), type: "custom" };
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    static fromString(d) {
        const _obj = JSON.parse(d);
        return FirestoreConverter.fromObject(_obj);
    }
    /**
     * Internal serialization
     * @param d - Object for serialization
     */
    static fromObject(d) {
        if (d.type === "string")
            return d.data;
        if (d.type === "number")
            return d.data;
        if (d.type === "boolean")
            return d.data;
        if (d.type === "null")
            return null;
        if (d.type === "timestamp")
            return firebase_admin_1.firestore.Timestamp.fromMillis(d.data);
        if (d.type === "document")
            return firebase_admin_1.firestore().doc(d.data);
        if (d.type === "geopoint")
            return new firebase_admin_1.firestore.GeoPoint(d.data.lat, d.data.long);
        if (d.type === "array") {
            const _arr = [];
            for (const val of d.data)
                _arr.push(FirestoreConverter.fromObject(val));
            return _arr;
        }
        if (d.type === "map") {
            const _obj = {};
            for (const key in d.data)
                _obj[key] = FirestoreConverter.fromObject(d.data[key]);
            return _obj;
        }
    }
}
exports.FirestoreConverter = FirestoreConverter;
//# sourceMappingURL=FirestoreConverter.js.map