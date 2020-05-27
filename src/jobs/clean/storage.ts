import { app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"

export class JobCleanStorage extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    private Storage = this.admin.storage()
    private Bucket = this.Storage.bucket(this.settings.serviceAccount.project_id+".appspot.com")
    public run = async () => {
        await this.Bucket.deleteFiles()
        console.log(" - Storage Clean Complete!")
        return
    }
}