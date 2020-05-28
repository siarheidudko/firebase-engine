"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupFirestore = void 0;
const initialization_1 = require("../../utils/initialization");
const template_1 = require("../../utils/template");
const Objectstream = require("@sergdudko/objectstream");
const FirestoreConverter_1 = require("../../utils/FirestoreConverter");
const Logger_1 = require("../../utils/Logger");
class JobBackupFirestore extends template_1.JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * documents counter
         */
        this.counter = 0;
        /**
         * backup one document
         */
        this.documentBackup = async (ref) => {
            ++this.counter;
            if ((this.counter % 100) === 0)
                Logger_1.Logger.log(" -- Firestore Backup - " + this.counter + " docs.");
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
            await new Promise(async (res, rej) => {
                try {
                    this.stringiferStream.pipe(this.writer.gzipStream);
                    this.writer.gzipStream.once("unpipe", () => {
                        Logger_1.Logger.log(" -- Firestore Backup - " + this.counter + " docs.");
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
        this.writer = initialization_1.createWriteFileStream(this.settings.backup);
        this.stringiferStream = new Objectstream.Stringifer();
        this.stringiferStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobBackupFirestore = JobBackupFirestore;
//# sourceMappingURL=firestore.js.map