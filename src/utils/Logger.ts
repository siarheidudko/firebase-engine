/**
 * Logger class
 */
export class Logger {
    /**
     * Log level
     */
    public static log(d: any){
        setTimeout(()=>{
            console.log(d)
        }, 0)
    }
    /**
     * Warning level
     */
    public static warn(d: any){
        setTimeout(()=>{
            console.warn(d)
        }, 0)
    }
    /**
     * Error level
     */
    public static error(d: any){
        setTimeout(()=>{
            console.error(d)
        }, 0)
    }
    /**
     * Log Table
     */
    public static table(d: any){
        setTimeout(()=>{
            console.table(d)
        }, 0)
    }
}