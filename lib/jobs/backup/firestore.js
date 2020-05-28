"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupFirestore = void 0;
const template_1 = require("../../utils/template");
const FirestoreConverter_1 = require("../../utils/FirestoreConverter");
const Logger_1 = require("../../utils/Logger");
class JobBackupFirestore extends template_1.JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * backup one document function
         */
        this.documentBackup = async (ref) => {
            ++this.counter;
            if ((this.counter % 100) === 0)
                Logger_1.Logger.log(" -- Firestore Backuped - " + this.counter + " docs in " + this.getWorkTime() + ".");
            const docSnap = await ref.get();
            if (!docSnap.exists)
                return;
            const docData = docSnap.data();
            if (!docData)
                return;
            const docString = FirestoreConverter_1.FirestoreConverter.toString(docData);
            const _doc = {
                service: "firestore",
                path: ref.path,
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
         * recursive backup function
         */
        this.recursiveBackup = async (ref) => {
            const collections = await ref.listCollections();
            for (const collectionRef of collections) {
                const collectionSnap = await collectionRef.get();
                for (let i = 1; i <= collectionSnap.docs.length; i++) {
                    await this.documentBackup(collectionSnap.docs[i - 1].ref);
                    await this.recursiveBackup(collectionSnap.docs[i - 1].ref);
                }
            }
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
                        Logger_1.Logger.log(" -- Firestore Backuped - " + this.counter + " docs in " + this.getWorkTime() + ".");
                        Logger_1.Logger.log(" - Firestore Backup Complete!");
                        res();
                    });
                    await this.recursiveBackup(this.firestore);
                    this.stringiferStream.unpipe(this.writer.gzipStream);
                }
                catch (err) {
                    rej(err);
                }
            });
            return;
        };
        this.firestore = this.admin.firestore();
    }
}
exports.JobBackupFirestore = JobBackupFirestore;
//# sourceMappingURL=firestore.js.map