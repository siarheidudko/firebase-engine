#!/usr/bin/env node

import { cmdParser, _Settings, initialization, Settings } from "../utils/initialization"
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
    }
]

/**
 * command line error helper
 */
function errorHandler(){
    Logger.log("=========================EXAMPLES=========================")
    Logger.log("backup-engine.js operations=\"clean, restore\", path=\"./test/utils/vend-park-development.json\" services=\"firestore, auth\" backup=\"vend-park-development.backup\"")
    Logger.log("backup-engine.js o=\"b, c\", p=\"./test/utils/vend-park-development.json\"")
    Logger.log("=========================ARGUMENTS========================")
    Logger.table(arg)
    Logger.log("===========================ERROR==========================")
}

/**
 * CLI
 */
( async() => {
    const _settings: _Settings = cmdParser()
    const init: {
        settings: Settings,
        admin: app.App
    } = initialization(_settings)
    const firebaseEngine: FirebaseEngine = new FirebaseEngine(init.settings)
    const run = async() => {
        for(const operation of init.settings.operations) for(const service of init.settings.services){
            Logger.log(operation+"/"+service)
            await firebaseEngine.jobs[operation][service]()
        }
        return
    }
    run().then(()=>{
        return firebaseEngine.exit()
    }).then(() => {
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
