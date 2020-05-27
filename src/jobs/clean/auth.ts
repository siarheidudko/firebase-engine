import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"

export class JobCleanAuth extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
    }
    private counter: number = 0
    private auth: Auth.Auth
    private recursiveClean = async (nextPageToken?: string) => {
        const listUsers = await this.auth.listUsers(1000, nextPageToken)
        for(const userRecord of listUsers.users){
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Auth Clean - "+this.counter+" users.")
            await this.auth.deleteUser(userRecord.uid)
        }
        if(listUsers.pageToken)
            await this.recursiveClean(listUsers.pageToken)
        return
    }
    public run = async () => {
        await this.recursiveClean()
        Logger.log(" -- Auth Clean - "+this.counter+" users.")
        Logger.log(" - Auth Clean Complete!")
        return
    }
}