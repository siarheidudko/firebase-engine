"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanStorage = void 0;
const template_1 = require("../../utils/template");
class JobCleanStorage extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.Storage = this.admin.storage();
        this.Bucket = this.Storage.bucket(this.settings.serviceAccount.project_id + ".appspot.com");
        this.run = async () => {
            await this.Bucket.deleteFiles();
            console.log(" - Storage Clean Complete!");
            return;
        };
    }
}
exports.JobCleanStorage = JobCleanStorage;
//# sourceMappingURL=storage.js.map