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
    private async recursiveClean(nextPageToken?: string){
        const listUsers = await this.auth.listUsers(1000, nextPageToken)
        const result = await this.auth.deleteUsers(listUsers.users.map((user) => { return user.uid }))
        this.counter += result.successCount
        Logger.log(" -- Auth Cleaned - "+this.counter+" users in "+this.getWorkTime()+".")
        if(listUsers.pageToken)
            await this.recursiveClean(listUsers.pageToken)
        return
    }
    /**
     * job runner
     */
    public async run(){
        this.startTimestamp = Date.now()
        await this.recursiveClean()
        await new Promise((res) => { setTimeout(res, 1) })
        Logger.log(" - Auth Clean Complete!")
        return
    }
}