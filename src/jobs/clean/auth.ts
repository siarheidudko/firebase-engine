import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobCleanAuth extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.auth = this.admin.auth()
    }
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
                Logger.log(" -- Auth Cleaned - "+this.counter+" users in "+this.getWorkTime()+".")
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
        this.startTimestamp = Date.now()
        await this.recursiveClean()
        Logger.log(" -- Auth Cleaned - "+this.counter+" users in "+this.getWorkTime()+".")
        Logger.log(" - Auth Clean Complete!")
        return
    }
}