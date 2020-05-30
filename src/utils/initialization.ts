import { readFileSync, createWriteStream, WriteStream } from "fs"
import { initializeApp, app, credential, apps } from "firebase-admin"
import { createGzip, Gzip } from "zlib"
import { Logger } from "../utils/Logger"
import { createHash, randomFillSync } from "crypto"

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
export const createWriteFileStream = (path: string, compress: boolean) => {
    const hash = createHash("sha1")
    hash.update(path)
    const key = hash.digest("hex")
    if(
        !writers[key] ||
        writers[key].fileStream.destroyed
    )
        writers[key] = new Writer(path, compress)
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
    constructor(path: string, compress: boolean){
        this.fileStream = createWriteStream(path, {
            flags: "w", 
            mode: 0o600
        })
        this.fileStream.on("error", (err) => {
            Logger.warn(err)
        })
        if(compress){
            this.compress = true
            this.gzipStream = createGzip()
            this.gzipStream.on("error", (err) => {
                Logger.warn(err)
            })
            this.gzipStream.pipe(this.fileStream)
        }
    }
    /**
     * use compress
     */
    public compress: boolean = false
    /**
     * file write stream after gzipped
     */
    public fileStream: WriteStream
    /**
     * gzip stream
     */
    public gzipStream?: Gzip
}

/**
 * settings object from command line interface
 */
export interface ParsedSettings {
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
    services: ("firestore"|"auth"|"storage")[],
    /**
     * use compress
     */
    compress: boolean
}
/**
 * settings object before initialization
 */
export interface SettingsBeforeInitialization {
    /**
     * path to Firebase service account key (json)
     */
    path?: string,
    /**
     * path to backup file
     */
    backup?: string,
    /**
     * use compress
     */
    compress: boolean
}
/**
 * settings object after initialization
 */
export interface Settings {
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
    /**
     * use compress
     */
    compress: boolean
}

/**
 * Command Line Parser
 */
export const cmdParser = (arg: string[]) => {
    /**
     * Settings object
     */
    const settings: ParsedSettings = {
        operations: [],
        path: undefined,
        backup: undefined,
        services: [],
        compress: true
    }
    arg.forEach((val) => {
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
            for(const _s of _service) switch(_s){
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
                    settings.services.push("auth")
                    settings.services.push("firestore")
                    settings.services.push("storage")
                    break
                default:
                    break
            }
        }
        if(val.match(/^--nocompress/i) || val.match(/^-nc/i))
            settings.compress = false
    })
    if(settings.operations.length === 0)
        settings.operations.push("backup")
    if(settings.services.length === 0)
        settings.services = [
            "auth",
            "firestore",
            "storage"
        ]
    return settings
}

/**
 * App initialization
 * 
 * @param settings - settings object
 */
export const initialization = (settings: SettingsBeforeInitialization = {
    path: undefined,
    backup: undefined,
    compress: true
}) =>  {
    if(store.settings && store.admin)
        return store as {
            settings: Settings,
            admin: app.App
        }
    const _settings: SettingsBeforeInitialization = {
        path: settings.path,
        backup: settings.backup,
        compress: settings.compress
    }
    if(typeof(_settings.path) !== "string")
        throw new Error("Service account path not set.")
    if(
        (typeof(_settings.backup) !== "undefined") && 
        (typeof(_settings.backup) !== "string")
    )
        throw new Error("Invalid backup argument.")
    if(typeof(_settings.compress) !== "boolean")
        throw new Error("Invalid backup argument.")
    store.settings = {
        ..._settings,
        serviceAccount: JSON.parse(readFileSync(_settings.path).toString())
    } as Settings
    if(!store.settings.backup)
        store.settings.backup = store.settings.serviceAccount.project_id+"_"+Date.now().toString()+".backup"
    if(!store.admin){
        const initializationConfig = {
            databaseURL: "https://"+store.settings.serviceAccount.project_id+".firebaseio.com",
            storageBucket: store.settings.serviceAccount.project_id+".appspot.com",
            projectId: store.settings.serviceAccount.project_id,
            credential: credential.cert(store.settings.serviceAccount)
        }
        if(apps.length > 0){
            const appName = randomFillSync(Buffer.alloc(16)).toString("hex")
            store.admin = initializeApp(initializationConfig, appName)
        } else {
            store.admin = initializeApp(initializationConfig)
        }
    }
    return store as {
        settings: Settings,
        admin: app.App
    }
}