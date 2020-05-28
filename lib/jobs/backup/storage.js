"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupStorage = void 0;
const template_1 = require("../../utils/template");
const StorageConverter_1 = require("../../utils/StorageConverter");
const Logger_1 = require("../../utils/Logger");
class JobBackupStorage extends template_1.JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * backup one file function
         */
        this.backupFile = async (file) => {
            const [buffer] = await file.download();
            if (!buffer)
                return;
            ++this.counter;
            if ((this.counter % 100) === 0)
                Logger_1.Logger.log(" -- Storage Backuped - " + this.counter + " files in " + this.getWorkTime() + ".");
            const docString = StorageConverter_1.StorageConverter.toString(buffer);
            const _doc = {
                service: "storage",
                path: file.name,
                data: docString
            };
            await new Promise((res, rej) => {
                this.stringiferStream.write(_doc, undefined, (err) => {
                    if (err)
                        Logger_1.Logger.warn(err);
                    res();
                });
            });
            return;
        };
        /**
         * job runner
         */
        this.run = async () => {
            this.startTimestamp = Date.now();
            await new Promise(async (res, rej) => {
                try {
                    this.stringiferStream.pipe(this.writer.gzipStream);
                    this.writer.gzipStream.once("unpipe", () => {
                        Logger_1.Logger.log(" -- Storage Backuped - " + this.counter + " files in " + this.getWorkTime() + ".");
                        Logger_1.Logger.log(" - Storage Backup Complete!");
                        res();
                    });
                    const [files] = await this.bucket.getFiles();
                    if (Array.isArray(files))
                        for (const file of files)
                            await this.backupFile(file);
                    this.stringiferStream.unpipe(this.writer.gzipStream);
                }
                catch (err) {
                    rej(err);
                }
            });
            return;
        };
        this.storage = this.admin.storage();
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id + ".appspot.com");
    }
}
exports.JobBackupStorage = JobBackupStorage;
//# sourceMappingURL=storage.js.map