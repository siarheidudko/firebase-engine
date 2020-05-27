"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanAuth = void 0;
const template_1 = require("../../utils/template");
const Logger_1 = require("../../utils/Logger");
class JobCleanAuth extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.counter = 0;
        this.recursiveClean = async (nextPageToken) => {
            const listUsers = await this.auth.listUsers(1000, nextPageToken);
            for (const userRecord of listUsers.users) {
                ++this.counter;
                if ((this.counter % 100) === 0)
                    Logger_1.Logger.log(" -- Auth Clean - " + this.counter + " users.");
                await this.auth.deleteUser(userRecord.uid);
            }
            if (listUsers.pageToken)
                await this.recursiveClean(listUsers.pageToken);
            return;
        };
        this.run = async () => {
            await this.recursiveClean();
            Logger_1.Logger.log(" -- Auth Clean - " + this.counter + " users.");
            Logger_1.Logger.log(" - Auth Clean Complete!");
            return;
        };
        this.auth = this.admin.auth();
    }
}
exports.JobCleanAuth = JobCleanAuth;
//# sourceMappingURL=auth.js.map