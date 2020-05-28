import { auth as Auth } from "firebase-admin"

/**
 * Auth Document converter
 */
export class AuthConverter {
    /**
     * Copy only the allowed fields, 
     * otherwise the object breaks 
     * inside firebase.auth (after recovery)
     */
    private static userField = [
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
    ]
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    public static toString (d: Auth.UserRecord){
        const obj:{[key: string]: any} = d.toJSON()
        const _obj:{[key: string]: any} = {}
        for(const key of AuthConverter.userField){
            if(obj[key]) _obj[key] = obj[key]
        }
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