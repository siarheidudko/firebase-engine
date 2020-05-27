import { app } from "firebase-admin"
import { _Settings, Settings, initialization } from "./utils/initialization"
import { Jobs } from "./jobs/Jobs"

export class FirebaseEngine {
    constructor(settings: _Settings| Settings, admin?: app.App){
        if(admin){
            this.settings = settings as Settings
            this.admin = admin
        } else {
            const init = initialization(settings)
            this.settings = init.settings
            this.admin = init.admin
        }
        this.jobs = new Jobs(this.settings, this.admin)
    }
    private settings: Settings
    private admin: app.App
    public jobs: Jobs
}