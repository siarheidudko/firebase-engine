export class Logger {
    public static log = (d: any) => {
        setTimeout(()=>{
            console.log(d)
        }, 0)
    }
    public static warn = (d: any) => {
        setTimeout(()=>{
            console.warn(d)
        }, 0)
    }
    public static error = (d: any) => {
        setTimeout(()=>{
            console.error(d)
        }, 0)
    }
    public static table(d: any){
        setTimeout(()=>{
            console.table(d)
        }, 0)
    }
}