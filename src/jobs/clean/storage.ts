import { app, storage as Storage } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"

export class JobCleanStorage extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
    }
    private storage: Storage.Storage
    private bucket: any
    public run = async () => {
        await this.bucket.deleteFiles()
        Logger.log(" - Storage Clean Complete!")
        return
    }
}