import { app, storage as Storage } from "firebase-admin"
import { Settings, Writer, createWriteFileStream } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupStorage extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
        this.writer = createWriteFileStream(this.settings.backup)
        this.stringiferStream = new Objectstream.Stringifer() as Transform
        this.stringiferStream.on("error", (err) => {
            Logger.warn(err)
        })
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
     * Writer streams in object
     */
    private writer: Writer
    /**
     * object to string stream
     */
    private stringiferStream: Transform
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
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.once("unpipe", () => {
                    Logger.log(" -- Storage Backuped - "+this.counter+" files in "+this.getWorkTime()+".")
                    Logger.log(" - Storage Backup Complete!")
                    res()
                })
                const [files] = await this.bucket.getFiles()
                if(Array.isArray(files)) for(const file of files)
                    await this.backupFile(file)
                this.stringiferStream.unpipe(this.writer.gzipStream)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}