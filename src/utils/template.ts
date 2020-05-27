import { app } from "firebase-admin"
import { Settings } from "./initialization"

export class JobTemplate {
    constructor(settings: Settings, admin: app.App  ){       
        this.settings = settings
        this.admin =  admin
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
    public firestore = async ()=>{ return; }
    public auth = async ()=>{ return; }
    public storage = async ()=>{ return; }
}