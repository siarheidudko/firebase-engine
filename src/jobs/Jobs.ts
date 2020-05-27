import { app } from "firebase-admin"
import { JobTemplate, JobOneTemplate } from "../utils/template"
import { Settings } from "../utils/initialization"

export class Jobs extends JobTemplate{
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    public backup: JobsBackup = new JobsBackup(this.settings, this.admin)
    public clean: JobsClean = new JobsClean(this.settings, this.admin)
    public restore: JobsRestore = new JobsRestore(this.settings, this.admin)
}

class JobsBackup extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
}

class JobsClean extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
}

class JobsRestore extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
}