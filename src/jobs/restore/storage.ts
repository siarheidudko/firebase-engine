import { app, storage as Storage } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
import { createReadStream, ReadStream } from "fs"
import { createGunzip, Gunzip } from "zlib"
const Objectstream = require("@sergdudko/objectstream")
import { Transform, Writable } from "stream"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreStorage extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
        this.fileStream = createReadStream(this.settings.backup, {
            flags: "r", 
            mode: 0o600, 
            highWaterMark: 64*1024
        })
        this.gunzipStream = createGunzip()
        this.parserStream = new Objectstream.Parser() as Transform
        const self = this
        this.writeStream = new Writable({
            write(object: DataModel, encoding, callback) { 
                (async () => {
                    if(
                        (object.service !== "storage") ||
                        (typeof(object.path) !== "string") ||
                        (typeof(object.data) !== "string")
                    )
                        return
                    const fileRef = await self.bucket.file(object.path)
                    const fileData = StorageConverter.fromString(object.data)
                    await fileRef.save(fileData)
                    ++self.counter
                    if((self.counter % 100) === 0)
                        Logger.log(" -- Storage Restore - "+self.counter+" files.")
                    return
                })().then(() => {
                    callback()
                    return
                }).catch((err) => {
                    callback(err)
                    return
                })			
            },
            objectMode: true
        })
        this.fileStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.gunzipStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.parserStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.writeStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    private counter: number = 0
    private storage: Storage.Storage
    private bucket: any
    private fileStream: ReadStream
    private gunzipStream: Gunzip
    private parserStream: Transform
    private writeStream: Writable
    public run = async () => {
        await new Promise((res, rej) => {
            this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream)
            this.writeStream.on("finish", () => {
                Logger.log(" -- Storage Restore - "+this.counter+" files.")
                Logger.log(" - Storage Restore Complete!")
                res()
            })
        })
        return
    }
}