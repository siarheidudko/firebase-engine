"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRestoreStorage = void 0;
const template_1 = require("../../utils/template");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const Objectstream = require("@sergdudko/objectstream");
const stream_1 = require("stream");
const StorageConverter_1 = require("../../utils/StorageConverter");
const Logger_1 = require("../../utils/Logger");
class JobRestoreStorage extends template_1.JobOneServiceTemplate {
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
            this.startTimestamp = Date.now();
            await new Promise((res, rej) => {
                this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream);
                this.writeStream.on("finish", () => {
                    Logger_1.Logger.log(" -- Storage Restored - " + this.counter + " files in " + this.getWorkTime() + ".");
                    Logger_1.Logger.log(" - Storage Restore Complete!");
                    res();
                });
            });
            return;
        };
        this.storage = this.admin.storage();
        this.bucket = this.storage.bucket(this.settings.serviceAccount.project_id + ".appspot.com");
        this.fileStream = fs_1.createReadStream(this.settings.backup, {
            flags: "r",
            mode: 0o600,
            highWaterMark: 64 * 1024
        });
        this.gunzipStream = zlib_1.createGunzip();
        this.parserStream = new Objectstream.Parser();
        const self = this;
        this.writeStream = new stream_1.Writable({
            write(object, encoding, callback) {
                (async () => {
                    if ((object.service !== "storage") ||
                        (typeof (object.path) !== "string") ||
                        (typeof (object.data) !== "string"))
                        return;
                    const fileRef = await self.bucket.file(object.path);
                    const fileData = StorageConverter_1.StorageConverter.fromString(object.data);
                    await fileRef.save(fileData);
                    ++self.counter;
                    if ((self.counter % 100) === 0)
                        Logger_1.Logger.log(" -- Storage Restored - " + self.counter + " files in " + self.getWorkTime() + ".");
                    return;
                })().then(() => {
                    callback();
                    return;
                }).catch((err) => {
                    callback(err);
                    return;
                });
            },
            objectMode: true
        });
        this.fileStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.gunzipStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.parserStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.writeStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobRestoreStorage = JobRestoreStorage;
//# sourceMappingURL=storage.js.map