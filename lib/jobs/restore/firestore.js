"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRestoreFirestore = void 0;
const template_1 = require("../../utils/template");
const stream_1 = require("stream");
const FirestoreConverter_1 = require("../../utils/FirestoreConverter");
const Logger_1 = require("../../utils/Logger");
class JobRestoreFirestore extends template_1.JobBackupSRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * firebase firestore app
         */
        this.firestore = this.admin.firestore();
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
             * batch object
             */
            batch: this.firestore.batch(),
            /**
             * clear this buffer
             */
            clear: async () => {
                this.writeBuffer.iteration = 1;
                this.writeBuffer.batch = this.firestore.batch();
                return this.writeBuffer;
            },
            /**
             * write this buffer to project and clean it
             */
            commit: async () => {
                await this.writeBuffer.batch.commit();
                await this.writeBuffer.clear();
                return this.writeBuffer;
            },
            /**
             * add document to this buffer
             */
            set: async (ref, data) => {
                ++this.counter;
                if ((this.counter % 100) === 0)
                    Logger_1.Logger.log(" -- Firebase Restored - " + this.counter + " docs in " + this.getWorkTime() + ".");
                ++this.writeBuffer.iteration;
                this.writeBuffer.batch.set(ref, data);
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
                    Logger_1.Logger.log(" -- Firebase Restored - " + this.counter + " docs in " + this.getWorkTime() + ".");
                    Logger_1.Logger.log(" - Firestore Restore Complete!");
                    res();
                });
            });
            await this.writeBuffer.commit();
            return;
        };
        const self = this;
        this.writeStream = new stream_1.Writable({
            write(object, encoding, callback) {
                (async () => {
                    if ((object.service !== "firestore") ||
                        (typeof (object.path) !== "string") ||
                        (typeof (object.data) !== "string"))
                        return;
                    const docRef = self.firestore.doc(object.path);
                    const docData = FirestoreConverter_1.FirestoreConverter.fromString(object.data);
                    await self.writeBuffer.set(docRef, docData);
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
exports.JobRestoreFirestore = JobRestoreFirestore;
//# sourceMappingURL=firestore.js.map