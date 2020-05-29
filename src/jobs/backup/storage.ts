import { app, storage as Storage } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceTemplate, DataModel } from "../../utils/template"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"
import { Gzip } from "zlib"
import { WriteStream } from "fs"

export class JobBackupStorage extends JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
    }
    /**
     * firebase storage app
     */
    private storage: Storage.Storage
    /**
     * storage bucket
     */
    private bucket: any
    /**
     * backup one file function
     */
    public backupFile = async (file: any) => {
        const [buffer] = await file.download()
        if(!buffer)
            return
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Storage Backuped - "+this.counter+" files in "+this.getWorkTime()+".")
        const docString = StorageConverter.toString(buffer)
        const _doc: DataModel = {
            service: "storage",
            path: file.name,
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
                const [files] = await this.bucket.getFiles()
                if(Array.isArray(files)) for(const file of files)
                    await this.backupFile(file)
                this.stringiferStream.unpipe(_write)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}