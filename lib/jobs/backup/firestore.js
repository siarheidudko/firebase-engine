"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupFirestore = void 0;
const firebase_admin_1 = require("firebase-admin");
const template_1 = require("../../utils/template");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const Objectstream = require("@sergdudko/objectstream");
const FirestoreConverter_1 = require("../../utils/FirestoreConverter");
class JobBackupFirestore extends template_1.JobOneServiceTemplate {
    constructor(settings, admin) {
        super(settings, admin);
        this.Firestore = firebase_admin_1.firestore();
        this.documentBackup = async (ref) => {
            const docSnap = await ref.get();
            if (!docSnap.exists)
                return;
            const docData = docSnap.data();
            if (!docData)
                return;
            const docJson = FirestoreConverter_1.FirestoreConverter.toString(docData);
            const _doc = {
                service: "firestore",
                path: ref.path,
                data: docJson
            };
            await new Promise((res, rej) => {
                this.stringiferStream.write(_doc, undefined, (err) => {
                    if (err)
                        console.warn(err);
                    res();
                });
            });
            return;
        };
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
        this.run = async () => {
            await new Promise(async (res, rej) => {
                this.stringiferStream.pipe(this.gzipStream).pipe(this.fileStream);
                //this.stringiferStream.pipe(this.fileStream)
                this.fileStream.on("finish", () => {
                    console.log(" - Firestore Backup Complete!");
                    res();
                });
                await this.recursiveBackup(this.Firestore);
                this.stringiferStream.end();
            });
            return;
        };
        this.fileStream = fs_1.createWriteStream(this.settings.backup, {
            flags: "w",
            mode: 0o600
        });
        this.gzipStream = zlib_1.createGzip();
        this.stringiferStream = new Objectstream.Stringifer("\n", "\n", "\n");
        this.stringiferStream.on("error", (err) => {
            console.warn(err);
        });
        this.gzipStream.on("error", (err) => {
            console.warn(err);
        });
        this.fileStream.on("error", (err) => {
            console.warn(err);
        });
    }
}
exports.JobBackupFirestore = JobBackupFirestore;
//# sourceMappingURL=firestore.js.map