const child_process = require("child_process")
const admin = require("firebase-admin")

/**
 * child process to promise
 */
module.exports.childProcessPromise = async (p, arg) => {
    const res = await new Promise((res,rej) => {
        let error = ""
        let data = ""
        const cp = child_process.spawn(p, arg).on("close", (e) => {
            if(e === 0) 
                res(data)
            else
                rej(error)
        }).on("error", (e) => {
            error += e.message
            rej(error)
        })
        cp.stdout.on("data", (e) => {
            data += e.toString()
        })
        cp.stderr.on("data", (e) => {
            error += e.toString()
        })
    })
    return res
}

module.exports.matching = (obj1, obj2, full) => {
    
}