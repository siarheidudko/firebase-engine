import { app } from "firebase-admin"
import { SettingsBeforeInitialization, Settings, initialization, writers } from "./utils/initialization"
import { Jobs } from "./jobs/Jobs"
import { Storage } from "@google-cloud/storage"

/**
 * Firebase Engine to copy data
 */
export class FirebaseEngine {
    /**
     * @param settings - settings object
     */
    constructor(settings: SettingsBeforeInitialization|Settings){
        const init = initialization(settings)
        this.settings = init.settings
        this.admin = init.admin
        this.store = init.store
        this.jobs = new Jobs(this.settings, this.admin, this.store)
    }
    /**
     * settings object
     */
    private settings: Settings
    /**
     * firebase app
     */
    private admin: app.App
    /**
     * Firebase Engine Jobs
     */
    public jobs: Jobs
    /**
     * Google cloud storage app
     */
    private store: Storage
    /**
     * Call this before exiting
     */
    public async exit(){
        const arr: Promise<any>[] = []
        for(const key in writers){
            const writer = writers[key]
            const promise = new Promise((res,rej) => {  
                if(writer.fileStream.destroyed){
                    res()
                    return
                }
                writer.fileStream.once("finish", () => {
                    res()
                })
                if(writer.gzipStream && !writer.gzipStream.destroyed)
                    writer.gzipStream.end()
                else if(!writer.fileStream.destroyed)
                    writer.fileStream.end()
                else
                    res()
            })
            arr.push(promise)
        }
        await Promise.all(arr)
        return
    }
}