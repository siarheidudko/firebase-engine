import { app } from "firebase-admin"
import { _Settings, Settings, initialization, writers } from "./utils/initialization"
import { Jobs } from "./jobs/Jobs"

/**
 * Firebase Engine to copy data
 */
export class FirebaseEngine {
    /**
     * @param settings - settings object
     */
    constructor(settings: _Settings| Settings){
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
        const arr: Promise<any>[] = [Promise.resolve()]
        for(const key in writers){
            const writer = writers[key]
            const promise = new Promise((res,rej) => {  
                writer.fileStream.on("finish", () => {
                    res()
                })
                writer.gzipStream.end()
            })
            arr.push(promise)
        }
        await Promise.all(arr)
        return
    }
}