import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"

export class JobCleanAuth extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
    }
    /**
     * user counter
     */
    private counter: number = 0
    /**
     * firebase auth app
     */
    private auth: Auth.Auth
    /**
     * recursive clean function
     */
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
    /**
     * job runner
     */
    public run = async () => {
        await this.recursiveClean()
        Logger.log(" -- Auth Clean - "+this.counter+" users.")
        Logger.log(" - Auth Clean Complete!")
        return
    }
}