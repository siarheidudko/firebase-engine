import { app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobRestoreStorage extends JobBackupServiceRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        const self = this
        this.buckets = []
        this.writeStream = new Writable({
            write(object: DataModel, encoding, callback) { 
                (async () => {
                    if(
                        (object.service !== "storage") ||
                        (typeof(object.path) !== "string") ||
                        (typeof(object.data) !== "string")
                    )
                        return
                    const fArg = object.path.split("://")
                    if(fArg.length !== 2) throw new Error("Invalid path")
                    const bName = fArg[0].replace(new RegExp("{default}", "g"), self.settings.serviceAccount.project_id)
                    if(
                        (self.settings.buckets.length !== 0) &&
                        (self.settings.buckets.indexOf(bName) === -1)
                    )
                        return
                    const bucket = self.store.bucket(bName)
                    if(self.buckets.indexOf(bucket.name) === -1){
                        const [f] = await bucket.exists()
                        if(!f) await bucket.create()
                        self.buckets.push(bName)
                    }
                    const fileRef = bucket.file(fArg[1])
                    const fileData = StorageConverter.fromString(object.data)
                    await fileRef.save(fileData)
                    ++self.counter
                    if((self.counter % 100) === 0)
                        Logger.log(" -- Storage Restored - "+self.counter+" files in "+self.getWorkTime()+".")
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
        this.writeStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    /**
     * Array of google storage bucket name
     */
    private buckets: string[]
    /**
     * write file to project stream
     */
    private writeStream: Writable
    /**
     * job runner
     */
    public run = async () => {
        this.startTimestamp = Date.now()
        await new Promise((res, rej) => {
            if(this.gunzipStream){
                const gunzip = this.gunzipStream
                this.gunzipStream.on("unpipe", () => {
                    gunzip.unpipe(this.parserStream)
                    gunzip.close()
                    this.parserStream.end()
                })
                this.fileStream.pipe(gunzip).pipe(this.parserStream).pipe(this.writeStream)
            } else {
                this.fileStream.pipe(this.parserStream).pipe(this.writeStream)
            }
            this.writeStream.on("finish", () => {
                Logger.log(" -- Storage Restored - "+this.counter+" files in "+this.getWorkTime()+".")
                Logger.log(" - Storage Restore Complete!")
                res()
            })
        })
        return
    }
}