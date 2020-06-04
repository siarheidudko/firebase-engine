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
import { Storage } from "@google-cloud/storage"

/**
 * Jobs Class
 */
export class Jobs extends JobTemplate{
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.backup = new JobsBackup(this.settings, this.admin, this.store)
        this.clean = new JobsClean(this.settings, this.admin, this.store)
        this.restore = new JobsRestore(this.settings, this.admin, this.store)
    }
    /**
     * backup jobs
     */
    public backup: JobsBackup
    /**
     * clean jobs
     */
    public clean: JobsClean
    /**
     * restore jobs
     */
    public restore: JobsRestore
}

/**
 * Backup Jobs Class
 */
class JobsBackup extends JobOneTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.auth = async () => {
            const newJob = new JobBackupAuth(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const newJob = new JobBackupFirestore(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobBackupStorage(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
    }
}

/**
 * Clean Jobs Class
 */
class JobsClean extends JobOneTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.auth = async () => {
            const newJob = new JobCleanAuth(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const newJob = new JobCleanFirestore(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobCleanStorage(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
    }
}

/**
 * Restore Jobs Class
 */
class JobsRestore extends JobOneTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.auth = async () => {
            const newJob = new JobRestoreAuth(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.firestore = async () => {
            const newJob = new JobRestoreFirestore(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
        this.storage = async () => {
            const newJob = new JobRestoreStorage(this.settings, this.admin, this.store)
            await newJob.run()
            return
        }
    }
}