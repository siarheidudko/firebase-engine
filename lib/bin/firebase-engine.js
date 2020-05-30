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
        "Description": "Do not use data compression"
    },
    {
        "Name": "algorithm",
        "Short name": "alg",
        "Description": "The password hashing information (algorithm). Default: SCRYPT"
    },
    {
        "Name": "base64_signer_key",
        "Short name": "bsk",
        "Description": "The password hashing information (key in base64 encoding). Default: user passwords are not restored if not set."
    },
    {
        "Name": "base64_salt_separator",
        "Short name": "bss",
        "Description": "The password hashing information (salt separator in base64). Default: Bw=="
    },
    {
        "Name": "rounds",
        "Short name": "rnd",
        "Description": "The password hashing information (rounds). Default: 8"
    },
    {
        "Name": "mem_cost",
        "Short name": "mc",
        "Description": "The password hashing information (memory cost). Default: 14"
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
    let firebaseEngine = new FirebaseEngine_1.FirebaseEngine(init.settings);
    const run = async () => {
        for (const operation of _settings.operations) {
            if (operation === "backup")
                firebaseEngine = new FirebaseEngine_1.FirebaseEngine(init.settings);
            for (const service of _settings.services) {
                const startMsg = operation[0].toUpperCase()
                    + operation.substr(1)
                    + "/"
                    + service[0].toUpperCase()
                    + service.substr(1)
                    + " Start";
                Logger_1.Logger.log(startMsg);
                await firebaseEngine.jobs[operation][service]();
            }
            if (operation === "backup")
                await firebaseEngine.exit();
        }
        return;
    };
    run().then(() => {
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