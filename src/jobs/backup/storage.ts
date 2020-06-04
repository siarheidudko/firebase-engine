import { app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceTemplate, DataModel } from "../../utils/template"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"
import { Gzip } from "zlib"
import { WriteStream } from "fs"
import { Storage, Bucket, File } from "@google-cloud/storage"

export class JobBackupStorage extends JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
    }
    /**
     * backup one file function
     */
    private backupFile = async (bucket: Bucket, file: File) => {
        const bName = bucket.name.replace(new RegExp(this.settings.serviceAccount.project_id, "g"), "{default}")
        const [buffer] = await file.download()
        if(!buffer)
            return
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Storage Backuped - "+this.counter+" files in "+this.getWorkTime()+".")
        const docString = StorageConverter.toString(buffer)
        const _doc: DataModel = {
            service: "storage",
            path: bName+"://"+file.name,
            data: docString
        }
        await new Promise((res, rej) => {
            this.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                if(err) Logger.warn(err)
                res()
            })
        })
        return
    }
    /**
     * job runner
     */
    public run = async () => {
        const [buckets] = await this.store.getBuckets()
        this.startTimestamp = Date.now()
        await new Promise(async (res, rej) => {
            try {
                let _write: Gzip|WriteStream
                if(this.writer.gzipStream){
                    _write = this.writer.gzipStream
                } else {
                    _write = this.writer.fileStream
                }
                this.stringiferStream.pipe(_write)
                _write.once("unpipe", () => {
                    Logger.log(" -- Storage Backuped - "+this.counter+" files in "+this.getWorkTime()+".")
                    Logger.log(" - Storage Backup Complete!")
                    res()
                })
                for(const bucket of buckets){
                    const [files] = await bucket.getFiles()
                    if(Array.isArray(files)) for(const file of files)
                        await this.backupFile(bucket, file)
                }
                this.stringiferStream.unpipe(_write)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}