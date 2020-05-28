import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceTemplate, DataModel } from "../../utils/template"
import { AuthConverter } from "../../utils/AuthConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupAuth extends JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
    }
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
                Logger.log(" -- Auth Backuped - "+this.counter+" users in "+this.getWorkTime()+".")
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
        this.startTimestamp = Date.now()
        await new Promise(async (res, rej) => {
            try {
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.once("unpipe", () => {
                    Logger.log(" -- Auth Backuped - "+this.counter+" users in "+this.getWorkTime()+".")
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