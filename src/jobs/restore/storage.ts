import { app, storage as Storage } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupSRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreStorage extends JobBackupSRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
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
     * firebase storage app
     */
    private storage: Storage.Storage
    /**
     * bucket object
     */
    private bucket: any
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
            this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream)
            this.writeStream.on("finish", () => {
                Logger.log(" -- Storage Restored - "+this.counter+" files in "+this.getWorkTime()+".")
                Logger.log(" - Storage Restore Complete!")
                res()
            })
        })
        return
    }
}