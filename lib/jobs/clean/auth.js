"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanAuth = void 0;
const template_1 = require("../../utils/template");
class JobCleanAuth extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.Auth = this.admin.auth();
        this.recursiveClean = async (nextPageToken) => {
            const listUsers = await this.Auth.listUsers(1000, nextPageToken);
            for (const userRecord of listUsers.users)
                await this.Auth.deleteUser(userRecord.uid);
            if (listUsers.pageToken)
                await this.recursiveClean(listUsers.pageToken);
            return;
        };
        this.run = async () => {
            await this.recursiveClean();
            console.log(" - Auth Clean Complete!");
            return;
        };
    }
}
exports.JobCleanAuth = JobCleanAuth;
//# sourceMappingURL=auth.js.map