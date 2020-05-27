"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jobs = void 0;
const template_1 = require("../utils/template");
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
    }
}
class JobsClean extends template_1.JobOneTemplate {
    constructor(settings, admin) {
        super(settings, admin);
    }
}
class JobsRestore extends template_1.JobOneTemplate {
    constructor(settings, admin) {
        super(settings, admin);
    }
}
//# sourceMappingURL=Jobs.js.map