"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRestoreFirestore = void 0;
const template_1 = require("../../utils/template");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const Objectstream = require("@sergdudko/objectstream");
const stream_1 = require("stream");
const FirestoreConverter_1 = require("../../utils/FirestoreConverter");
const Logger_1 = require("../../utils/Logger");
class JobRestoreFirestore extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.counter = 0;
        this.firestore = this.admin.firestore();
        this.writeBuffer = {
            batchSize: 100,
            iteration: 0,
            batch: this.firestore.batch(),
            clear: async () => {
                this.writeBuffer.iteration = 1;
                this.writeBuffer.batch = this.firestore.batch();
                return this.writeBuffer;
            },
            commit: async () => {
                await this.writeBuffer.batch.commit();
                await this.writeBuffer.clear();
                return this.writeBuffer;
            },
            set: async (ref, data) => {
                ++this.counter;
                if ((this.counter % 100) === 0)
                    Logger_1.Logger.log(" -- Firebase Restore - " + this.counter + " docs.");
                ++this.writeBuffer.iteration;
                this.writeBuffer.batch.set(ref, data);
                if (this.writeBuffer.iteration === this.writeBuffer.batchSize) {
                    await this.writeBuffer.commit();
                }
                return this.writeBuffer;
            }
        };
        this.run = async () => {
            await new Promise((res, rej) => {
                this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream);
                //this.fileStream.pipe(this.parserStream).pipe(this.writeStream)
                this.writeStream.on("finish", () => {
                    Logger_1.Logger.log(" -- Firebase Restore - " + this.counter + " docs.");
                    Logger_1.Logger.log(" - Firestore Restore Complete!");
                    res();
                });
            });
            await this.writeBuffer.commit();
            return;
        };
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
exports.JobRestoreFirestore = JobRestoreFirestore;
//# sourceMappingURL=firestore.js.map