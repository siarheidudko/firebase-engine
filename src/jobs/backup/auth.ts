import { app, auth as Auth } from "firebase-admin"
import { Settings, Writer, createWriteFileStream } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { AuthConverter } from "../../utils/AuthConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupAuth extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
        this.writer = createWriteFileStream(this.settings.backup)
        this.stringiferStream = new Objectstream.Stringifer() as Transform
        this.stringiferStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    /**
     * user counter
     */
    private counter: number = 0
    /**
     * Writer streams in object
     */
    private writer: Writer
    /**
     * object to string stream
     */
    private stringiferStream: Transform
    /**
     * firebase auth app
     */
    private auth: Auth.Auth
    /**
     * recursive backup function
     */
    private recursiveBackup = async (nextPageToken?: string) => {
        const listUsers = await this.auth.listUsers(1000, nextPageToken)
        for(const userRecord of listUsers.users){
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Auth Backup - "+this.counter+" users.")
            const docString = AuthConverter.toString(userRecord)
            const _doc: DataModel = {
                service: "auth",
                path: userRecord.uid,
                data: docString
            }
            await new Promise((res, rej) => {
                this.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                    if(err) Logger.warn(err)
                    res()
                })
            })
        }
        if(listUsers.pageToken)
            await this.recursiveBackup(listUsers.pageToken)
        return
    }
    /**
     * job runner
     */
    public run = async () => {
        await new Promise(async (res, rej) => {
            try {
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.once("unpipe", () => {
                    Logger.log(" -- Auth Backup - "+this.counter+" users.")
                    Logger.log(" - Auth Backup Complete!")
                    res()
                })
                await this.recursiveBackup()
                this.stringiferStream.unpipe(this.writer.gzipStream)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}