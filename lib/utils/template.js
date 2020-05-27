"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOneServiceTemplate = exports.JobOneTemplate = exports.JobTemplate = void 0;
class JobTemplate {
    constructor(settings, admin) {
        this.settings = settings;
        this.admin = admin;
    }
}
exports.JobTemplate = JobTemplate;
class JobOneTemplate extends JobTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.firestore = async () => {
            console.warn("Not supported.");
            return;
        };
        this.auth = async () => {
            console.warn("Not supported.");
            return;
        };
        this.storage = async () => {
            console.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneTemplate = JobOneTemplate;
class JobOneServiceTemplate extends JobTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.run = async () => {
            console.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneServiceTemplate = JobOneServiceTemplate;
//# sourceMappingURL=template.js.map