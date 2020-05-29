"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupAuth = void 0;
const template_1 = require("../../utils/template");
const AuthConverter_1 = require("../../utils/AuthConverter");
const Logger_1 = require("../../utils/Logger");
class JobBackupAuth extends template_1.JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * recursive backup function
         */
        this.recursiveBackup = async (nextPageToken) => {
            const listUsers = await this.auth.listUsers(1000, nextPageToken);
            for (const userRecord of listUsers.users) {
                ++this.counter;
                if ((this.counter % 100) === 0)
                    Logger_1.Logger.log(" -- Auth Backuped - " + this.counter + " users in " + this.getWorkTime() + ".");
                const docString = AuthConverter_1.AuthConverter.toString(userRecord);
                const _doc = {
                    service: "auth",
                    path: userRecord.uid,
                    data: docString
                };
                await new Promise((res, rej) => {
                    this.stringiferStream.write(_doc, undefined, (err) => {
                        if (err)
                            Logger_1.Logger.warn(err);
                        res();
                    });
                });
            }
            if (listUsers.pageToken)
                await this.recursiveBackup(listUsers.pageToken);
            return;
        };
        /**
         * job runner
         */
        this.run = async () => {
            this.startTimestamp = Date.now();
            await new Promise(async (res, rej) => {
                try {
                    let _write;
                    if (this.writer.gzipStream) {
                        _write = this.writer.gzipStream;
                    }
                    else {
                        _write = this.writer.fileStream;
                    }
                    this.stringiferStream.pipe(_write);
                    _write.once("unpipe", () => {
                        Logger_1.Logger.log(" -- Auth Backuped - " + this.counter + " users in " + this.getWorkTime() + ".");
                        Logger_1.Logger.log(" - Auth Backup Complete!");
                        res();
                    });
                    await this.recursiveBackup();
                    this.stringiferStream.unpipe(_write);
                }
                catch (err) {
                    rej(err);
                }
            });
            return;
        };
        this.auth = this.admin.auth();
    }
}
exports.JobBackupAuth = JobBackupAuth;
//# sourceMappingURL=auth.js.map