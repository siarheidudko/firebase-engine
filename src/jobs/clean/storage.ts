import { app, storage as Storage } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"

export class JobCleanStorage extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.storage = this.admin.storage()
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
    }
    /**
     * firebase storage app
     */
    private storage: Storage.Storage
    /**
     * bucket object
     */
    private bucket: any
    /**
     * job runner
     */
    public run = async () => {
        await this.bucket.deleteFiles()
        Logger.log(" - Storage Clean Complete!")
        return
    }
}