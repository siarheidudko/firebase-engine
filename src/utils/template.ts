import { app } from "firebase-admin"
import { Settings } from "./initialization"
import { Logger } from "./Logger"

export class JobTemplate {
    constructor(settings: Settings, admin: app.App  ){       
        this.settings = settings
        this.admin = admin
    }
    settings: {
        operations: string[],
        path: string,
        backup: string,
        services: string[],
        serviceAccount: {[key: string]: any}
    }
    admin: app.App
}

export class JobOneTemplate extends JobTemplate{
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    public firestore = async () => { 
        Logger.warn("Not supported.")
        return
    }
    public auth = async () => { 
        Logger.warn("Not supported.")
        return
    }
    public storage = async () => { 
        Logger.warn("Not supported.")
        return
    }
}

export class JobOneServiceTemplate extends JobTemplate{
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    public run = async () => { 
        Logger.warn("Not supported.")
        return
    }
}

export interface DataModel {
    service: "firestore"|"auth"|"storage",
    path: string,
    data: string
}