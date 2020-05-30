"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRestoreAuth = void 0;
const template_1 = require("../../utils/template");
const stream_1 = require("stream");
const AuthConverter_1 = require("../../utils/AuthConverter");
const Logger_1 = require("../../utils/Logger");
class JobRestoreAuth extends template_1.JobBackupSRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * buffer for write to project
         */
        this.writeBuffer = {
            /**
             * batch size
             */
            batchSize: 100,
            /**
             * iteration
             */
            iteration: 0,
            /**
             * array of user
             */
            batch: [],
            /**
             * clear this buffer
             */
            clear: async () => {
                this.writeBuffer.iteration = 1;
                this.writeBuffer.batch = [];
                return this.writeBuffer;
            },
            /**
             * write this buffer to project and clean it
             */
            commit: async () => {
                let res;
                if (this.settings.hash_config)
                    res = await this.auth.importUsers(this.writeBuffer.batch, {
                        hash: this.settings.hash_config
                    });
                else
                    res = await this.auth.importUsers(this.writeBuffer.batch);
                if (res.failureCount !== 0) {
                    this.counter -= res.failureCount;
                    Logger_1.Logger.warn(JSON.stringify(res.errors));
                }
                await this.writeBuffer.clear();
                return this.writeBuffer;
            },
            /**
             * add user to this buffer
             */
            set: async (ref, data) => {
                ++this.counter;
                if ((this.counter % 100) === 0)
                    Logger_1.Logger.log(" -- Auth Restored - " + this.counter + " users in " + this.getWorkTime() + ".");
                ++this.writeBuffer.iteration;
                this.writeBuffer.batch.push(data);
                if (this.writeBuffer.iteration === this.writeBuffer.batchSize) {
                    await this.writeBuffer.commit();
                }
                return this.writeBuffer;
            }
        };
        /**
         * job runner
         */
        this.run = async () => {
            this.startTimestamp = Date.now();
            await new Promise((res, rej) => {
                if (this.gunzipStream) {
                    const gunzip = this.gunzipStream;
                    this.gunzipStream.on("unpipe", () => {
                        gunzip.unpipe(this.parserStream);
                        gunzip.close();
                        this.parserStream.end();
                    });
                    this.fileStream.pipe(gunzip).pipe(this.parserStream).pipe(this.writeStream);
                }
                else {
                    this.fileStream.pipe(this.parserStream).pipe(this.writeStream);
                }
                this.writeStream.on("finish", () => {
                    Logger_1.Logger.log(" -- Auth Restored - " + this.counter + " users in " + this.getWorkTime() + ".");
                    Logger_1.Logger.log(" - Auth Restore Complete!");
                    res();
                });
            });
            await this.writeBuffer.commit();
            return;
        };
        this.auth = this.admin.auth();
        const self = this;
        this.writeStream = new stream_1.Writable({
            write(object, encoding, callback) {
                (async () => {
                    if ((object.service !== "auth") ||
                        (typeof (object.path) !== "string") ||
                        (typeof (object.data) !== "string"))
                        return;
                    const userRef = object.path;
                    let userData;
                    if (self.settings.hash_config)
                        userData = AuthConverter_1.AuthConverter.fromString(object.data, true);
                    else
                        userData = AuthConverter_1.AuthConverter.fromString(object.data, false);
                    await self.writeBuffer.set(userRef, userData);
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
        this.writeStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobRestoreAuth = JobRestoreAuth;
//# sourceMappingURL=auth.js.map