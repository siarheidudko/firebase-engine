"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOneTemplate = exports.JobTemplate = void 0;
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
        this.firestore = async () => { return; };
        this.auth = async () => { return; };
        this.storage = async () => { return; };
    }
}
exports.JobOneTemplate = JobOneTemplate;
//# sourceMappingURL=template.js.map