import { app, storage as Storage } from "firebase-admin"
import { Settings, Writer, createWriteFileStream } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { StorageConverter } from "../../utils/StorageConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupStorage extends JobOneServiceTemplate {
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
    private counter: number = 0
    private storage: Storage.Storage
    private bucket: any
    private writer: Writer
    private stringiferStream: Transform
    public backupFile = async (file: any) => {
        const [buffer] = await file.download()
        if(!buffer)
            return
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Storage Backup - "+this.counter+" files.")
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
    public run = async () => {
        await new Promise(async (res, rej) => {
            try {
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.once("unpipe", () => {
                    Logger.log(" -- Storage Backup - "+this.counter+" files.")
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