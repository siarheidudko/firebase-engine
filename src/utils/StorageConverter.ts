/**
 * Storage File converter
 */
export class StorageConverter {
    /**
     * Convert an object to a string
     * @param d - Object for convert
     */
    public static toString(d: Buffer){
        return d.toString("base64")
    }
    /**
     * Convert string to object
     * @param d - String to convert
     */
    public static fromString(d: string){
        return Buffer.from(d, "base64")
    }
}