import { readFileSync, createWriteStream, WriteStream } from "fs"
import { initializeApp, app, credential, apps, auth } from "firebase-admin"
import { createGzip, Gzip } from "zlib"
import { Logger } from "../utils/Logger"
import { createHash, randomFillSync } from "crypto"
import { Storage } from "@google-cloud/storage"

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
    /**
     * Google cloud storage app
     */
    store?: Storage
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
    /**
     * password hash config
     */
    hash_config: {
        algorithm?: auth.HashAlgorithmType,
        base64_signer_key?: Buffer,
        base64_salt_separator?: Buffer,
        rounds?: number,
        mem_cost?: number
    }
    /**
     * buckets for processing
     */
    buckets: string[]
    /**
     * collections for processing
     */
    collections: string[]
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
    /**
     * password hash config
     */
    hash_config?: {
        algorithm?: auth.HashAlgorithmType,
        base64_signer_key?: Buffer,
        base64_salt_separator?: Buffer,
        rounds?: number,
        mem_cost?: number
    }
    /**
     * buckets for processing
     */
    buckets: string[]
    /**
     * collections for processing
     */
    collections: string[]
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
    /**
     * password hash config
     */
    hash_config?: {
        algorithm: auth.HashAlgorithmType,
        key: Buffer,
        saltSeparator: Buffer,
        rounds: number,
        memoryCost: number
    }
    /**
     * buckets for processing
     */
    buckets: string[]
    /**
     * collections for processing
     */
    collections: string[]
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
        compress: true,
        hash_config: {},
        buckets: [],
        collections: []
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
        if(val.match(/^algorithm=/i) || val.match(/^alg=/i))
            settings.hash_config.algorithm = val.replace(/^alg=/i, "")
                .replace(/^algorithm=/i, "")
                .replace(/"/g, "").toUpperCase() as auth.HashAlgorithmType
        if(val.match(/^base64_signer_key=/i) || val.match(/^bsk=/i))
            settings.hash_config.base64_signer_key = Buffer.from(
                val.replace(/^bsk=/i, "")
                .replace(/^base64_signer_key=/i, "")
                .replace(/"/g, ""), 
                "base64")
        if(val.match(/^base64_salt_separator=/i) || val.match(/^bss=/i))
            settings.hash_config.base64_salt_separator = Buffer.from(
                val.replace(/^bss=/i, "")
                .replace(/^base64_salt_separator=/i, "")
                .replace(/"/g, ""), 
                "base64")
        if(val.match(/^rounds=/i) || val.match(/^rnd=/i))
                settings.hash_config.rounds = Number.parseInt(
                    val.replace(/^rnd=/i, "")
                    .replace(/^rounds=/i, "")
                    .replace(/"/g, ""))
        if(val.match(/^mem_cost=/i) || val.match(/^mc=/i))
            settings.hash_config.mem_cost = Number.parseInt(
                val.replace(/^mc=/i, "")
                .replace(/^mem_cost=/i, "")
                .replace(/"/g, ""))
        if(val.match(/^buckets=/i) || val.match(/^buck=/i))
            settings.buckets = val.replace(/^buckets=/i, "")
                .replace(/^buck=/i, "")
                .replace(/"/g, "")
                .replace(/\s/g, "")
                .split(",")
        if(val.match(/^collections=/i) || val.match(/^coll=/i))
            settings.collections = val.replace(/^collections=/i, "")
                .replace(/^coll=/i, "")
                .replace(/"/g, "")
                .replace(/\s/g, "")
                .split(",")
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
    compress: true,
    buckets: [],
    collections: []
}) =>  {
    if(
        settings.hash_config &&
        settings.hash_config.algorithm && 
        (settings.hash_config.algorithm !== "SCRYPT")
    )
        throw new Error("Only SCRYPT algorithm implemented.")
    if(store.settings && store.admin && store.store)
        return store as {
            settings: Settings,
            admin: app.App,
            store: Storage
        }
    const _settings: SettingsBeforeInitialization = {
        path: settings.path,
        backup: settings.backup,
        compress: settings.compress,
        buckets: settings.buckets,
        collections: settings.collections
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
    if(
        (typeof(settings.hash_config) === "object") &&
        (settings.hash_config.base64_signer_key instanceof Buffer)
    ){
        store.settings.hash_config = {
            algorithm: "SCRYPT",
            key: settings.hash_config.base64_signer_key,
            saltSeparator: Buffer.from("Bw==", "base64"),
            rounds: 8,
            memoryCost: 14
        }
        if(typeof(settings.hash_config.algorithm) === "string")
            store.settings.hash_config.algorithm = settings.hash_config.algorithm
        if(settings.hash_config.base64_salt_separator instanceof Buffer)
            store.settings.hash_config.saltSeparator = settings.hash_config.base64_salt_separator
        if(typeof(settings.hash_config.rounds) === "number")
            store.settings.hash_config.rounds = settings.hash_config.rounds
        if(typeof(settings.hash_config.mem_cost) === "number")
            store.settings.hash_config.memoryCost = settings.hash_config.mem_cost
    }     
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
    if(!store.store){
        store.store = new Storage({
            projectId: store.settings.serviceAccount.project_id,
            credentials: {
                client_email: store.settings.serviceAccount.client_email,
                private_key: store.settings.serviceAccount.private_key
            }
        })
    }
    return store as {
        settings: Settings,
        admin: app.App,
        store: Storage
    }
}