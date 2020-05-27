#!/usr/bin/env node

import { cmdParser, _Settings } from "../utils/initialization"
import { FirebaseEngine } from "../FirebaseEngine"

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
    const settings: _Settings = cmdParser()
    const firebaseEngine: FirebaseEngine = new FirebaseEngine(settings)
    const run = async() => {
        for(const operation of settings.operations) for(const service of settings.services){
            await firebaseEngine.jobs[
                operation as "backup"|"clean"|"restore"
            ][
                service as "firestore"|"auth"|"storage"
            ]()
            console.log(operation, service)
        }
        return
    }
    run().then(() => {
        console.log("Complete!")
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
