import { app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"

export class JobCleanAuth extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    private Auth = this.admin.auth()
    private recursiveClean = async (nextPageToken?: string) => {
        const listUsers = await this.Auth.listUsers(1000, nextPageToken)
        for(const userRecord of listUsers.users)
            await this.Auth.deleteUser(userRecord.uid)
        if(listUsers.pageToken)
            await this.recursiveClean(listUsers.pageToken)
        return
    }
    public run = async () => {
        await this.recursiveClean()
        console.log(" - Auth Clean Complete!")
        return
    }
}