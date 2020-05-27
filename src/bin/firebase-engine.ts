#!/usr/bin/env node

import { cmdParser, _Settings, initialization, Settings } from "../utils/initialization"
import { FirebaseEngine } from "../FirebaseEngine"
import { app } from "firebase-admin"

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

function errorHandler(){
    console.log("=========================EXAMPLES=========================")
    console.log("backup-engine.js operations=\"clean, restore\", path=\"./test/utils/vend-park-development.json\" services=\"firestore, auth\" backup=\"vend-park-development.backup\"")
    console.log("backup-engine.js o=\"b, c\", p=\"./test/utils/vend-park-development.json\"")
    console.log("=========================ARGUMENTS========================")
    console.table(arg)
    console.log("===========================ERROR==========================")
}

( async() => {
    const _settings: _Settings = cmdParser()
    const init: {
        settings: Settings,
        admin: app.App
    } = initialization(_settings)
    const firebaseEngine: FirebaseEngine = new FirebaseEngine(init.settings, init.admin)
    const run = async() => {
        for(const operation of init.settings.operations) for(const service of init.settings.services){
            console.log(operation, service)
            await firebaseEngine.jobs[
                operation as "backup"|"clean"|"restore"
            ][
                service as "firestore"|"auth"|"storage"
            ]()
        }
        return
    }
    run().then(() => {
        console.log("All Jobs Complete!")
        process.exit(0)
    }).catch((err) => {
        errorHandler()
        console.error(err.message)
        process.exit(1)
    })
})().catch((err: Error) => {
    errorHandler()
    console.error(err.message)
    process.exit(1)
})
