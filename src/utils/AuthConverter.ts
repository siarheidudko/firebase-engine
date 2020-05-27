import { auth as Auth } from "firebase-admin"

/**
 * Auth Document converter
 */
export class AuthConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    public static toString (d: Auth.UserRecord){
        const _obj:{[key: string]: any} = d.toJSON()
        return JSON.stringify(_obj)
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    public static fromString(d: string){
        const _obj: {[key: string]: any} = JSON.parse(d)
        return _obj as {uid: string, [key: string]: any}
    }
}