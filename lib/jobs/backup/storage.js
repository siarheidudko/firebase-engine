"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupStorage = void 0;
const initialization_1 = require("../../utils/initialization");
const template_1 = require("../../utils/template");
const Objectstream = require("@sergdudko/objectstream");
const StorageConverter_1 = require("../../utils/StorageConverter");
const Logger_1 = require("../../utils/Logger");
class JobBackupStorage extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.counter = 0;
        this.backupFile = async (file) => {
            const [buffer] = await file.download();
            if (!buffer)
                return;
            ++this.counter;
            if ((this.counter % 100) === 0)
                Logger_1.Logger.log(" -- Storage Backup - " + this.counter + " files.");
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
        this.run = async () => {
            await new Promise(async (res, rej) => {
                try {
                    this.stringiferStream.pipe(this.writer.gzipStream);
                    this.writer.gzipStream.once("unpipe", () => {
                        Logger_1.Logger.log(" -- Storage Backup - " + this.counter + " files.");
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
        this.writer = initialization_1.createWriteFileStream(this.settings.backup);
        this.stringiferStream = new Objectstream.Stringifer();
        this.stringiferStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobBackupStorage = JobBackupStorage;
//# sourceMappingURL=storage.js.map