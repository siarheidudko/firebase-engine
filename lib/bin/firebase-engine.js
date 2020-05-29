#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initialization_1 = require("../utils/initialization");
const FirebaseEngine_1 = require("../FirebaseEngine");
const Logger_1 = require("../utils/Logger");
/**
 * command line help table
 */
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
    },
    {
        "Name": "--nocompress",
        "Short name": "-nc",
        "Description": "Do not use data compression (sometimes zlib throws an error, this will help)"
    }
];
/**
 * command line error helper
 */
function errorHandler() {
    Logger_1.Logger.log("=========================EXAMPLES=========================");
    Logger_1.Logger.log("backup-engine.js operations=\"clean, restore\" path=\"./test/utils/vend-park-development.json\" services=\"firestore, auth\" backup=\"vend-park-development.backup\"");
    Logger_1.Logger.log("backup-engine.js o=\"b, c\" p=\"./test/utils/vend-park-development.json\"");
    Logger_1.Logger.log("=========================ARGUMENTS========================");
    Logger_1.Logger.table(arg);
    Logger_1.Logger.log("===========================ERROR==========================");
}
/**
 * CLI
 */
(async () => {
    const _settings = initialization_1.cmdParser(process.argv);
    const init = initialization_1.initialization(_settings);
    const firebaseEngine = new FirebaseEngine_1.FirebaseEngine(init.settings);
    const run = async () => {
        for (const operation of _settings.operations)
            for (const service of _settings.services) {
                Logger_1.Logger.log(operation + "/" + service);
                await firebaseEngine.jobs[operation][service]();
            }
        return;
    };
    run().then(() => {
        return firebaseEngine.exit();
    }).then(() => {
        Logger_1.Logger.log("All Jobs Complete!");
        setTimeout(process.exit, 1, 0);
    }).catch((err) => {
        errorHandler();
        Logger_1.Logger.error(err.message);
        setTimeout(process.exit, 1, 1);
    });
})().catch((err) => {
    errorHandler();
    Logger_1.Logger.error(err.message);
    setTimeout(process.exit, 1, 1);
});
//# sourceMappingURL=firebase-engine.js.map