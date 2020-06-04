/**
 * This console will work with a callable function, 
 * allowing you to pass context to the called function. 
 * It also allows the use of single-line commands with assignment 
 * of variables and executes javascript code. 
 * This is convenient when you need to transfer a file 
 * or a large amount of data to a function (for example).
 * @author Siarhei Dudko <siarhei.dudko@sergdudko.tk>
 */

"use strict"
const servicename = "Firebase Engine CLI"
const fastcommands  = []
const readline = require("readline")
const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccount.json")
const Gstorage = require("@google-cloud/storage")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

function help(){
	console.table(fastcommands, ["command", "title", "alias"])
}
fastcommands.push({
    "command": "help()",
    "title": "Сall current help",
    "alias": "help()"
})

const auth = admin.auth()
fastcommands.push({
    "command": "auth",
    "title": "Сall firebase authorization interface",
    "alias": "admin.auth()"
})

const db = admin.firestore()
fastcommands.push({
    "command": "db",
    "title": "Сall firebase firestore interface",
    "alias": "admin.firestore()"
})

const storage = new Gstorage.Storage({
    projectId: serviceAccount.project_id,
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
    }
})
fastcommands.push({
    "command": "storage",
    "title": "Сall google cloud storage interface",
    "alias": "---"
})

const bucket = storage.bucket(serviceAccount.project_id+".appspot.com")
fastcommands.push({
    "command": "bucket",
    "title": "Сall firebase storage/bucket interface",
    "alias": "---"
})

const types = admin.firestore
fastcommands.push({
    "command": "types",
    "title": "Сall firebase firestore types interface",
    "alias": "admin.firestore"
})

const constants = []
const globalKeys = Object.keys(global)
function lineHandler(str){
    // delete space
    str = str.replace(/^ +/, "")
    // search let/var/const
    if(str.search(/^(let|const|var) +[a-zA-Z]+\d* *=/) !== -1){
        const _str = str.replace(/^(let|const|var) +/, "")
        const _match = _str.match(/^[a-zA-Z]+\d* *=/)
        if((_match === null) || (typeof(_match[0]) !== "string"))
            throw new Error("lineHandler error, please see you regexp.")
        // get variable name
        const _var = _match[0].replace(/ *=$/, "")
        if((_var.search(/(let|var|const)/gi) !== -1) || (globalKeys.indexOf(_var) !== -1))
            throw new TypeError("Please don't use this variable name.")
        if(this[_var])
            throw new TypeError("Variable "+_var+" already declared.")
        // add to constants
        if(str.search(/^const +/) !== -1)
            constants.push(_var)
        str = "this."+_str
    } else if(str.search(/^[a-zA-Z]+\d* *=/) !== -1){
        const _match = str.match(/^[a-zA-Z]+\d* *=/)
        if((_match === null) || (typeof(_match[0]) !== "string"))
            throw new Error("lineHandler error, please see you regexp.")
        // get variable name
        const _var = _match[0].replace(/ *=$/, "")
        // chek constants
        if(constants.indexOf(_var) !== -1)
            throw new TypeError("Assignment to constant variable.")
        if(this[_var])
            str = "this."+str
    }
    return str
}
async function evalInContext(str){
    if(str && (str !== "")){
        str = lineHandler.call(this, str)
        const _match = str.match(/^this\.[a-zA-Z]+\d*/)
        if(_match && _match[0])
            return await eval("(async()=>{\n"+str+";\nreturn "+_match[0]+";\n})()")
        else
            return await eval("(async()=>{\n const _result = "+str+";\nreturn _result;\n})()")
    } else
        return

}
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: servicename+">"
})

const exit = () => { rl.close() }
fastcommands.push({
    "command": "exit()",
    "title": "Exit console",
    "alias": "rl.close()"
})

help()
rl.prompt()
rl.on("line", async (line) => {
	try{
        const _result = await evalInContext.call(global, line)
        if(typeof(_result) !== "undefined")
            console.log(_result)
	} catch(err) {
        if(err instanceof TypeError)
            console.error(err.message)
        else
		    console.error(err)
    }
    rl.prompt()
	return
}).on("close", () => {
	console.log(servicename+" disconnected!")
	process.exit(0)
})