"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanStorage = void 0;
const template_1 = require("../../utils/template");
const Logger_1 = require("../../utils/Logger");
class JobCleanStorage extends template_1.JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * job runner
         */
        this.run = async () => {
            await this.bucket.deleteFiles();
            Logger_1.Logger.log(" - Storage Clean Complete!");
            return;
        };
        this.storage = this.admin.storage();
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id + ".appspot.com");
    }
}
exports.JobCleanStorage = JobCleanStorage;
//# sourceMappingURL=storage.js.map