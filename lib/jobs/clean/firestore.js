"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanFirestore = void 0;
const template_1 = require("../../utils/template");
const Logger_1 = require("../../utils/Logger");
let JobCleanFirestore = /** @class */ (() => {
    class JobCleanFirestore extends template_1.JobOneServiceTemplate {
        constructor(settings, admin) {
            super(settings, admin);
            this.counter = 0;
            this.batchClean = async (arr) => {
                for (const ref of arr) {
                    this.batch.delete(ref);
                    await this.recursiveClean(ref);
                }
                await this.batch.commit();
                this.batch = this.firestore.batch();
                return;
            };
            this.recursiveClean = async (ref) => {
                const collections = await ref.listCollections();
                for (const collectionRef of collections) {
                    const collectionSnap = await collectionRef.get();
                    let arr = [];
                    for (let i = 1; i <= collectionSnap.docs.length; i++) {
                        ++this.counter;
                        if ((this.counter % 100) === 0)
                            Logger_1.Logger.log(" -- Firestore Clean - " + this.counter + " docs.");
                        arr.push(collectionSnap.docs[i - 1].ref);
                        if (((i % JobCleanFirestore.batchSize) === 0) ||
                            (i === collectionSnap.docs.length)) {
                            await this.batchClean(arr);
                            arr = [];
                        }
                    }
                }
                return;
            };
            this.run = async () => {
                await this.recursiveClean(this.firestore);
                Logger_1.Logger.log(" -- Firestore Clean - " + this.counter + " docs.");
                Logger_1.Logger.log(" - Firestore Clean Complete!");
                return;
            };
            this.firestore = this.admin.firestore();
            this.batch = this.firestore.batch();
        }
    }
    JobCleanFirestore.batchSize = 100;
    return JobCleanFirestore;
})();
exports.JobCleanFirestore = JobCleanFirestore;
//# sourceMappingURL=firestore.js.map