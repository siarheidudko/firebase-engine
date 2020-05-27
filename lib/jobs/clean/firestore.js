"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCleanFirestore = void 0;
const firebase_admin_1 = require("firebase-admin");
const template_1 = require("../../utils/template");
let JobCleanFirestore = /** @class */ (() => {
    class JobCleanFirestore extends template_1.JobOneServiceTemplate {
        constructor(settings, admin) {
            super(settings, admin);
            this.firestore = firebase_admin_1.firestore();
            this.batch = this.firestore.batch();
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
                console.log(" - Firestore Clean Complete!");
                return;
            };
        }
    }
    JobCleanFirestore.batchSize = 100;
    return JobCleanFirestore;
})();
exports.JobCleanFirestore = JobCleanFirestore;
//# sourceMappingURL=firestore.js.map