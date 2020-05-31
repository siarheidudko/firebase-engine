import { firestore as Firestore } from "firebase-admin"

/**
 * Firestore Document converter
 */
export class FirestoreConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    public static toString (d:{[key: string]: any}){
        const _obj:{[key: string]: any} = FirestoreConverter.toObject(d)
        return JSON.stringify(_obj)
    }
    /**
     * Internal deserialization
     * @param d - Object for deserialization
     */
    private static toObject(d: any){
        if(typeof(d) === "string")
            return { data: d, type: "string" }
        if(typeof(d) === "number")
            return { data: d, type: "number" }
        if(typeof(d) === "boolean")
            return { data: d, type: "boolean" }
        if(d === null)
            return { data: d, type: "null" }
        if(d instanceof Buffer)
            return { data: d.toString("base64"), type: "binary" }
        if(d instanceof Firestore.Timestamp)
            return { data: {sec: d.seconds, nano: d.nanoseconds}, type: "timestamp" }
        if(d instanceof Firestore.DocumentReference)
            return { data: d.path, type: "document" }
        if(d instanceof Firestore.GeoPoint)
            return { data: {lat: d.latitude, long: d.longitude}, type: "geopoint" }
        if(Array.isArray(d)){
            const _arr: {
                data: any[]
                type: "array"
            } = { data: [], type: "array" }
            for(const val of d)
                _arr.data.push(FirestoreConverter.toObject(val))
            return _arr
        }
        const clearObject = {} as {
            __proto__: any
        }
        if(d.__proto__ === clearObject.__proto__){
            const _obj: {
                data: {[key: string]: any}
                type: "map"
            } = { data: {}, type: "map" }
            for(const key in d)
                _obj.data[key] = FirestoreConverter.toObject(d[key])
            return _obj
        }
        throw new Error("Invalid data type.")
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    public static fromString(d: string){
        const _obj: {[key: string]: any} = JSON.parse(d)
        return FirestoreConverter.fromObject(_obj)
    }
    /**
     * Internal serialization
     * @param d - Object for serialization
     */
    private static fromObject(d: any){
        switch(d.type){
            case "string":
            case "number":
            case "boolean":
                return d.data
            case "null":
                return null
            case "binary":
                return Buffer.from(d.data, "base64")
            case "timestamp":
                return new Firestore.Timestamp(d.data.sec, d.data.nano)
            case "document":
                return Firestore().doc(d.data)
            case "geopoint":
                return new Firestore.GeoPoint(d.data.lat, d.data.long)
            case "array":
                const _arr: any[] = []
                for(const val of d.data)
                    _arr.push(FirestoreConverter.fromObject(val))
                return _arr
            case "map":
                const _obj: {[key: string]: any} = {}
                for(const key in d.data)
                    _obj[key] = FirestoreConverter.fromObject(d.data[key])
                return _obj
            default:
                throw new Error("Invalid data type.")
        }
    }
}