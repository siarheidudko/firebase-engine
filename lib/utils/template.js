"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOneServiceTemplate = exports.JobOneTemplate = exports.JobTemplate = void 0;
const Logger_1 = require("./Logger");
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
            Logger_1.Logger.warn("Not supported.");
            return;
        };
        this.auth = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
        this.storage = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneTemplate = JobOneTemplate;
class JobOneServiceTemplate extends JobTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.run = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneServiceTemplate = JobOneServiceTemplate;
//# sourceMappingURL=template.js.map