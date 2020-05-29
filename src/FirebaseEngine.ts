import { app } from "firebase-admin"
import { SettingsBeforeInitialization, Settings, initialization, writers } from "./utils/initialization"
import { Jobs } from "./jobs/Jobs"

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
        this.jobs = new Jobs(this.settings, this.admin)
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
     * Call this before exiting
     */
    public exit = async () => {
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