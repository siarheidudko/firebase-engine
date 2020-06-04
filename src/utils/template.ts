import { app } from "firebase-admin"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { createReadStream, ReadStream } from "fs"
import { createGunzip, Gunzip } from "zlib"
import { Settings, Writer, createWriteFileStream } from "./initialization"
import { Logger } from "./Logger"
import { Storage } from "@google-cloud/storage"

/**
 * Job Template Class
 */
export class JobTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){       
        this.settings = settings
        this.admin = admin
        this.store = store
    }
    /**
     * settings object
     */
    public settings: Settings
    /**
     * firebase app
     */
    public admin: app.App
    /**
     * Google cloud storage app
     */
    public store: Storage
}

/**
 * Job One Template Class
 */
export class JobOneTemplate extends JobTemplate{
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
    }
    /**
     * Jobs for Firebase.Firestore
     */
    public firestore = async () => { 
        Logger.warn("Not supported.")
        return
    }
    /**
     * Jobs for Firebase.Auth
     */
    public auth = async () => { 
        Logger.warn("Not supported.")
        return
    }
    /**
     * Jobs for Firebase.Storage
     */
    public storage = async () => { 
        Logger.warn("Not supported.")
        return
    }
}

/**
 * Job class
 */
export class JobOneServiceTemplate extends JobTemplate{
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.startTimestamp = Date.now()
    }
    /**
     * operation counter
     */
    public counter: number = 0
    /**
     * get work time
     */
    public getWorkTime = () => {
        const time = Date.now() - this.startTimestamp
        if(time < 5000)
            return time + " ms"
        if(time < 300000)
            return Number.parseInt((time/1000).toFixed()) + " sec"
        return Number.parseInt((time/60000).toFixed()) + " min"       
    }
    /**
     * start timestamp
     */
    public startTimestamp: number
    /**
     * Job runner
     */
    public run = async () => { 
        Logger.warn("Not supported.")
        return
    }
}

/**
 * Job backup
 */
export class JobBackupServiceTemplate extends JobOneServiceTemplate{
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.writer = createWriteFileStream(this.settings.backup, this.settings.compress)
        this.stringiferStream = new Objectstream.Stringifer() as Transform
        this.stringiferStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    /**
     * Writer streams in object
     */
    public writer: Writer
    /**
     * object to string stream
     */
    public stringiferStream: Transform
}

/**
 * Job restore
 */
export class JobBackupServiceRestoreTemplate extends JobOneServiceTemplate{
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.fileStream = createReadStream(this.settings.backup, {
            flags: "r", 
            mode: 0o600
        })
        this.parserStream = new Objectstream.Parser() as Transform
        this.fileStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.parserStream.on("error", (err) => {
            Logger.warn(err)
        })
        if(this.settings.compress){
            this.gunzipStream = createGunzip()
            this.gunzipStream.on("error", (err) => {
                Logger.warn(err)
            })
        }
    }
    /**
     * file read stream
     */
    public fileStream: ReadStream
    /**
     * unzip stream
     */
    public gunzipStream?: Gunzip
    /**
     * string to object stream
     */
    public parserStream: Transform
}

/**
 * Data Model
 */
export interface DataModel {
    /**
     * service type
     */
    service: "firestore"|"auth"|"storage",
    /**
     * document path
     */
    path: string,
    /**
     * document data
     */
    data: string
}