#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initialization_1 = require("../utils/initialization");
const FirebaseEngine_1 = require("../FirebaseEngine");
const arg = [
    {
        "Name": "operations",
        "Short name": "o",
        "Description": "backup (b), restore (r) or clean (c). Default: backup"
    },
    {
        "Name": "path",
        "Short name": "p",
        "Description": "Path to service account JSON file"
    },
    {
        "Name": "services",
        "Short name": "s",
        "Description": "firestore (f), storage (s), auth (a), can be separated by commas. Default: all"
    },
    {
        "Name": "backup",
        "Short name": "b",
        "Description": "Path to backup or restore file. Default: ./{$PROJECT_ID + $TIMESTAMP}.backup"
    }
];
function errorHandler() {
    console.log("=========================EXAMPLES=========================");
    console.log("backup-engine.js operations=\"clean, restore\", path=\"./test/utils/vend-park-development.json\" services=\"firestore, auth\" backup=\"vend-park-development.backup\"");
    console.log("backup-engine.js o=\"b, c\", p=\"./test/utils/vend-park-development.json\"");
    console.log("=========================ARGUMENTS========================");
    console.table(arg);
    console.log("===========================ERROR==========================");
}
(async () => {
    const settings = initialization_1.cmdParser();
    const firebaseEngine = new FirebaseEngine_1.FirebaseEngine(settings);
    const run = async () => {
        for (const operation of settings.operations)
            for (const service of settings.services) {
                await firebaseEngine.jobs[operation][service]();
                console.log(operation, service);
            }
        return;
    };
    run().then(() => {
        console.log("Complete!");
        process.exit(0);
    }).catch((err) => {
        errorHandler();
        console.error(err.message);
        process.exit(1);
    });
})().catch((err) => {
    errorHandler();
    console.error(err.message);
    process.exit(1);
});
//# sourceMappingURL=firebase-engine.js.map