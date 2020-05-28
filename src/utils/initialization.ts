import { readFileSync, createWriteStream, WriteStream } from "fs"
import { initializeApp, app, credential } from "firebase-admin"
import { createGzip, Gzip } from "zlib"
import { Logger } from "../utils/Logger"
import { createHash } from "crypto"

/**
 * Module store (to prevent secondary initialization)
 */
const store: {
    /**
     * firebase app
     */
    admin?: app.App,
    /**
     * settings object
     */
    settings?: Settings
} = {}

/**
 * write streams
 */
export const writers: {[key: string]: Writer} = {}
/**
 * Create write stream
 * 
 * @param path - path to file for write
 */
export const createWriteFileStream = (path: string) => {
    const hash = createHash("sha1")
    hash.update(path)
    const key = hash.digest("hex")
    if(!writers[key])
        writers[key] = new Writer(path)
    return writers[key]
}
/**
 * Writer Class for create write streams
 */
export class Writer {
    /**
     * 
     * @param path - path to file for write
     */
    constructor(path: string){
        this.fileStream = createWriteStream(path, {
            flags: "w", 
            mode: 0o600
        })
        this.gzipStream = createGzip()
        this.gzipStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.fileStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.gzipStream.pipe(this.fileStream)
    }
    /**
     * file write stream after gzipped
     */
    public fileStream: WriteStream
    /**
     * gzip stream
     */
    public gzipStream: Gzip
}

/**
 * settings object before initialization
 */
export interface _Settings {
    /**
     * array of operations
     */
    operations: ("backup"|"clean"|"restore")[],
    /**
     * path to Firebase service account key (json)
     */
    path?: string,
    /**
     * path to backup file
     */
    backup?: string,
    /**
     * service for backup/clean/restore
     */
    services: ("firestore"|"auth"|"storage")[]
}
/**
 * settings object after initialization
 */
export interface Settings extends _Settings {
    /**
     * path to Firebase service account key (json)
     */
    path: string,
    /**
     * path to backup file
     */
    backup: string,
    /**
     * Firebase service account key (object)
     */
    serviceAccount: {[key: string]: any}
}

/**
 * Command Line Parser
 */
export const cmdParser = () => {
    /**
     * Settings object
     */
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

/**
 * App initialization
 * 
 * @param settings - settings object
 */
export const initialization = (settings: _Settings = {
    operations: [],
    path: undefined,
    backup: undefined,
    services: []
}) =>  {
    if(store.settings && store.admin)
        return store as {
            settings: Settings,
            admin: app.App
        }
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
    if(!store.admin)
        store.admin = initializeApp({
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
    store.settings = _settings as Settings
    return store as {
        settings: Settings,
        admin: app.App
    }
}