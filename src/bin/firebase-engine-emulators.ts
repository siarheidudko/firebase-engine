#!/usr/bin/env node

import { FirebaseEngine } from "../FirebaseEngine"
import { Logger } from "../utils/Logger"
import { randomFillSync } from "crypto"
import { tmpdir } from "os"
import { join } from "path"
import { promises } from "fs"

/**
 * command line help table
 */
const arg: {
    "Name": string,
    "Short name": string,
    "Description": string
}[] = [
    {
        "Name": "--to-emulators",
        "Short name": "-to",
        "Description": "Copy data from project to emulators (only firestore)"
    },
    {
        "Name": "--from-emulators",
        "Short name": "-from",
        "Description": "Copy data from emulators to project (only firestore)"
    },
    {
        "Name": "path",
        "Short name": "p",
        "Description": "Path to service account JSON file"
    }
]

/**
 * command line error helper
 */
function errorHandler(){
    Logger.log("=========================EXAMPLES=========================")
    Logger.log("firebase-engine-emulators path=\"./test/utils/vend-park-development.json\" --to-emulators")
    Logger.log("firebase-engine-emulators p=\"./test/utils/vend-park-development.json\" -from")
    Logger.log("=========================ARGUMENTS========================")
    Logger.table(arg)
    Logger.log("===========================ERROR==========================")
}

const run = async () => {
    const settings: {
        path?: string,
        toEmulator?: boolean
    } = {}
    process.argv.forEach((val) => {
        if(val.match(/^path=/i) || val.match(/^p=/i))
            settings.path = val.replace(/^p=/i, "").replace(/^path=/i, "").replace(/"/g, "")
        if(val.match(/^--to-emulators/i) || val.match(/^-to/i)){
            if(typeof(settings.toEmulator) === "boolean")
                throw new Error("Please use only one param --to-emulators (-to) or --from-emulators (-from).")
            settings.toEmulator = true
        }
        if(val.match(/^--from-emulators/i) || val.match(/^-from/i)){
            if(typeof(settings.toEmulator) === "boolean")
                throw new Error("Please use only one param --to-emulators (-to) or --from-emulators (-from).")
            settings.toEmulator = false
        }
    })
    if(typeof(settings.path) !== "string")
        throw new Error("Service account path not set.")
    if(typeof(settings.toEmulator) !== "boolean")
        throw new Error("Param --to-emulators (-to) or --from-emulators (-from) not set.")   
    const backupPath = join(tmpdir(), randomFillSync(Buffer.alloc(5)).toString("hex") + ".backup")
    const firebaseEngine1 = new FirebaseEngine({
        path: settings.path,
        backup: backupPath,
        compress: true,
        emulators: (settings.toEmulator)?false:true,
        buckets: [],
        collections: []
    })
    await firebaseEngine1.jobs.backup.firestore()
    await firebaseEngine1.exit()
    await new Promise((res) => { setTimeout(res, 1) })
    const firebaseEngine2 = new FirebaseEngine({
        path: settings.path,
        backup: backupPath,
        compress: true,
        emulators: settings.toEmulator,
        buckets: [],
        collections: []
    })
    await firebaseEngine2.jobs.restore.firestore()
    await firebaseEngine2.exit()
    await new Promise((res) => { setTimeout(res, 1) })
    await promises.unlink(backupPath)
}

run().then(() => {
    Logger.log("Transfer done.")
    setTimeout(process.exit, 1, 0)
}).catch((error) => {
    errorHandler()
    Logger.error(error.message)
    setTimeout(process.exit, 1, 1)
})