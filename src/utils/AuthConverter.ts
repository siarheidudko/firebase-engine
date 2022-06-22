import { UserRecord } from "./FirebaseAuth";

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
  ];
  /**
   * Convert an object to a string
   * @param d - Object for convert
   */
  public static toString(d: UserRecord) {
    const obj: { [key: string]: any } = d.toJSON();
    const _obj: { [key: string]: any } = {};
    for (const key of AuthConverter.userField) {
      if (obj[key]) _obj[key] = obj[key];
    }
    return JSON.stringify(_obj);
  }
  /**
   * Convert string to object
   * @param d - String to convert
   */
  public static fromString(d: string, restorePassword: boolean = false) {
    const _obj: { [key: string]: any } = JSON.parse(d);
    if (restorePassword) {
      if (_obj.passwordHash)
        _obj.passwordHash = Buffer.from(_obj.passwordHash, "base64");
      if (_obj.passwordSalt)
        _obj.passwordSalt = Buffer.from(_obj.passwordSalt, "base64");
    } else {
      if (_obj.passwordHash) _obj.passwordHash = undefined;
      if (_obj.passwordSalt) _obj.passwordSalt = undefined;
    }
    return _obj as { uid: string; [key: string]: any };
  }
}
