import { app } from "firebase-admin"
import { JobTemplate, JobOneTemplate } from "../utils/template"
import { Settings } from "../utils/initialization"
import { JobBackupAuth } from "./backup/auth"
import { JobBackupFirestore } from "./backup/firestore"
import { JobBackupStorage } from "./backup/storage"
import { JobCleanAuth } from "./clean/auth"
import { JobCleanFirestore } from "./clean/firestore"
import { JobCleanStorage } from "./clean/storage"
import { JobRestoreAuth } from "./restore/auth"
import { JobRestoreFirestore } from "./restore/firestore"
import { JobRestoreStorage } from "./restore/storage"

export class Jobs extends JobTemplate{
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.backup = new JobsBackup(this.settings, this.admin)
        this.clean = new JobsClean(this.settings, this.admin)
        this.restore = new JobsRestore(this.settings, this.admin)
    }
    public backup: JobsBackup
    public clean: JobsClean
    public restore: JobsRestore
}

class JobsBackup extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = async () => {
            const newJob = new JobBackupAuth(this.settings, this.admin)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const job = new JobBackupFirestore(this.settings, this.admin)
            await job.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobBackupStorage(this.settings, this.admin)
            await newJob.run()
            return
        }
    }
}

class JobsClean extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = async () => {
            const newJob = new JobCleanAuth(this.settings, this.admin)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const newJob = new JobCleanFirestore(this.settings, this.admin)
            await newJob.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobCleanStorage(this.settings, this.admin)
            await newJob.run()
            return
        }
    }
}

class JobsRestore extends JobOneTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = async () => {
            const newJob = new JobRestoreAuth(this.settings, this.admin)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const newJob = new JobRestoreFirestore(this.settings, this.admin)
            await newJob.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobRestoreStorage(this.settings, this.admin)
            await newJob.run()
            return
        }
    }
}