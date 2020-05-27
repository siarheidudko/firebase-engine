import { readFileSync } from "fs"
import { initializeApp, app, credential } from "firebase-admin"

export interface Settings {
    operations: string[],
    path: string,
    backup: string,
    services: string[],
    serviceAccount: {[key: string]: any}
}
export interface _Settings {
    operations: string[],
    path?: string,
    backup?: string,
    services: string[]
}

export const cmdParser = () => {
    const settings: _Settings = {
        operations: [],
        path: undefined,
        backup: undefined,
        services: []
    }
    process.argv.forEach((val) => {
        if(val.match(/^path=/i) || val.match(/^p=/i))
            settings.path = val.replace(/^p=/i, "").replace(/^path=/i, "").replace(/"/g, "")
        if(val.match(/^backup=/i) || val.match(/^b=/i))
            settings.backup = val.replace(/^b=/i, "").replace(/^backup=/i, "").replace(/"/g, "")
        if(val.match(/^operations=/i) || val.match(/^o=/i)){
            const _operation = val.replace(/^o=/i, "").replace(/^operations=/i, "").replace(/"/g, "").replace(/\s/g, "").split(",")
            for(const _o of _operation) switch(_o){
                case "backup":
                case "clean":
                case "restore":
                    settings.operations.push(_o)
                    break
                case "b":
                    settings.operations.push("backup")
                    break
                case "c":
                    settings.operations.push("clean")
                    break
                case "r":
                    settings.operations.push("restore")
                    break
                default:
                    break
            }
        }
        if(val.match(/^services=/i) || val.match(/^s=/i)){
            const _service = val.replace(/^s=/i, "").replace(/^services=/i, "").replace(/"/g, "").replace(/\s/g, "").split(",")
            serviceParser: for(const _s of _service) switch(_s){
                case "firestore":
                case "auth":
                case "storage":
                    settings.services.push(_s)
                    break
                case "f":
                    settings.services.push("firestore")
                    break
                case "a":
                    settings.services.push("auth")
                    break
                case "s":
                    settings.services.push("storage")
                    break
                case "all":
                    settings.services = [
                        "auth",
                        "firestore",
                        "storage"
                    ]
                    break serviceParser
                default:
                    break
            }
        }
    })
    return settings
}

export const initialization = (settings: _Settings = {
    operations: [],
    path: undefined,
    backup: undefined,
    services: []
}) =>  {
    const _settings: {[key: string]: any} = {
        operations: settings.operations,
        path: settings.path,
        backup: settings.backup,
        services: settings.services
    }
    if(!_settings.path){
        throw new Error("Service account path not set.")
    }
    _settings.serviceAccount = JSON.parse(readFileSync(_settings.path).toString())
    if(!_settings.backup)
        _settings.backup = _settings.serviceAccount.project_id+"_"+Date.now().toString()+".backup"
    const admin:  app.App = initializeApp({
        databaseURL: "https://"+_settings.serviceAccount.project_id+".firebaseio.com",
        storageBucket: _settings.serviceAccount.project_id+".appspot.com",
        projectId: _settings.serviceAccount.project_id,
        credential: credential.cert(_settings.serviceAccount)
    })
    if(_settings.operations.length === 0)
        _settings.operations.push("backup")
    if(_settings.services.length === 0)
        _settings.services = [
            "auth",
            "firestore",
            "storage"
        ]
    return {
        settings: _settings as Settings,
        admin: admin
    }
}