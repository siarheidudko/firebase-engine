import { app } from "firebase-admin"
import { _Settings, Settings, initialization } from "./utils/initialization"
import { Jobs } from "./jobs/Jobs"

export class FirebaseEngine {
    constructor(settings: _Settings){
        const init = initialization(settings)
        this.settings = init.settings
        this.admin = init.admin
    }
    settings: Settings
    admin: app.App
    public jobs: Jobs = new Jobs(this.settings, this.admin)
}