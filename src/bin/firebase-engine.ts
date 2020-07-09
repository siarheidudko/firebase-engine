#!/usr/bin/env node

import { cmdParser, ParsedSettings, initialization, Settings } from "../utils/initialization"
import { FirebaseEngine } from "../FirebaseEngine"
import { app } from "firebase-admin"
import { Logger } from "../utils/Logger"

/**
 * command line help table
 */
const arg: {
    "Name": string,
    "Short name": string,
    "Description": string
}[] = [
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
        "Name": "collections",
        "Short name": "coll",
        "Description": "Apply to Collections (in Firestore service). Example for a subcollection of a pages inside a books collection: collections=\"books.pages\" Default: all, if it is not set"
    },
    {
        "Name": "buckets",
        "Short name": "buck",
        "Description": "Apply to Buckets (in Storage service). Default: all, if it is not set"
    },
    {
        "Name": "--nocompress",
        "Short name": "-nc",
        "Description": "Do not use data compression"
    },
    {
        "Name": "--emulators",
        "Short name": "-em",
        "Description": "Use firebase emulators (work for firestore)"
    },
    {
        "Name": "algorithm",
        "Short name": "alg",
        "Description": "The password hashing information (algorithm, only SCRYPT). Default: SCRYPT"
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
]

/**
 * command line error helper
 */
function errorHandler(){
    Logger.log("=========================EXAMPLES=========================")
    Logger.log("backup-engine.js operations=\"clean, restore\" path=\"./test/utils/vend-park-development.json\" services=\"firestore, auth\" backup=\"vend-park-development.backup\"")
    Logger.log("backup-engine.js o=\"b, c\" p=\"./test/utils/vend-park-development.json\"")
    Logger.log("=========================ARGUMENTS========================")
    Logger.table(arg)
    Logger.log("===========================ERROR==========================")
}

/**
 * CLI
 */
( async() => {
    const _settings: ParsedSettings = cmdParser(process.argv)
    const init: {
        settings: Settings,
        admin: app.App
    } = initialization(_settings)
    let firebaseEngine: FirebaseEngine = new FirebaseEngine(init.settings)
    const run = async() => {
        for(const operation of _settings.operations){
            if(operation === "backup")
                firebaseEngine = new FirebaseEngine(init.settings)
            for(const service of _settings.services){
                const startMsg = operation[0].toUpperCase()
                    + operation.substr(1)
                    + "/"
                    + service[0].toUpperCase()
                    + service.substr(1)
                    + " Start"
                Logger.log(startMsg)
                await firebaseEngine.jobs[operation][service]()
            }
            if(operation === "backup")
                await firebaseEngine.exit()
        }
        return
    }
    run().then(() => {
        Logger.log("All Jobs Complete!")
        setTimeout(process.exit, 1, 0)
    }).catch((err) => {
        errorHandler()
        Logger.error(err.message)
        setTimeout(process.exit, 1, 1)
    })
})().catch((err: Error) => {
    errorHandler()
    Logger.error(err.message)
    setTimeout(process.exit, 1, 1)
})
