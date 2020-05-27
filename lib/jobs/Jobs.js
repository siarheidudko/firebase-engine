"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jobs = void 0;
const template_1 = require("../utils/template");
const auth_1 = require("./backup/auth");
const firestore_1 = require("./backup/firestore");
const storage_1 = require("./backup/storage");
const auth_2 = require("./clean/auth");
const firestore_2 = require("./clean/firestore");
const storage_2 = require("./clean/storage");
const auth_3 = require("./restore/auth");
const firestore_3 = require("./restore/firestore");
const storage_3 = require("./restore/storage");
class Jobs extends template_1.JobTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.backup = new JobsBackup(this.settings, this.admin);
        this.clean = new JobsClean(this.settings, this.admin);
        this.restore = new JobsRestore(this.settings, this.admin);
    }
}
exports.Jobs = Jobs;
class JobsBackup extends template_1.JobOneTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.auth = async () => {
            const newJob = new auth_1.JobBackupAuth(this.settings, this.admin);
            await newJob.run();
            return;
        };
        this.firestore = async () => {
            const job = new firestore_1.JobBackupFirestore(this.settings, this.admin);
            await job.run();
            return;
        };
        this.storage = async () => {
            const newJob = new storage_1.JobBackupStorage(this.settings, this.admin);
            await newJob.run();
            return;
        };
    }
}
class JobsClean extends template_1.JobOneTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.auth = async () => {
            const newJob = new auth_2.JobCleanAuth(this.settings, this.admin);
            await newJob.run();
            return;
        };
        this.firestore = async () => {
            const newJob = new firestore_2.JobCleanFirestore(this.settings, this.admin);
            await newJob.run();
            return;
        };
        this.storage = async () => {
            const newJob = new storage_2.JobCleanStorage(this.settings, this.admin);
            await newJob.run();
            return;
        };
    }
}
class JobsRestore extends template_1.JobOneTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.auth = async () => {
            const newJob = new auth_3.JobRestoreAuth(this.settings, this.admin);
            await newJob.run();
            return;
        };
        this.firestore = async () => {
            const newJob = new firestore_3.JobRestoreFirestore(this.settings, this.admin);
            await newJob.run();
            return;
        };
        this.storage = async () => {
            const newJob = new storage_3.JobRestoreStorage(this.settings, this.admin);
            await newJob.run();
            return;
        };
    }
}
//# sourceMappingURL=Jobs.js.map