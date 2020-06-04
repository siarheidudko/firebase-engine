import { app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobCleanStorage extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
    }
    /**
     * job runner
     */
    public run = async () => {
        const [buckets] = await this.store.getBuckets()
        this.startTimestamp = Date.now()
        for(const bucket of buckets){
            await bucket.deleteFiles()
            if(bucket.name.indexOf(this.admin.options.storageBucket as string))
            await bucket.delete()
        }
        Logger.log(" -- Storage Cleaned docs in "+this.getWorkTime()+".")
        Logger.log(" - Storage Clean Complete!")
        return
    }
}