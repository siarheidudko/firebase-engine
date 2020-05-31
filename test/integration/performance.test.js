"use strict"
require("mocha")
const admin = require("firebase-admin")
const path = require("path")
const crypto = require("crypto")
const settings = require("../utils/settings")
const fsPromises = require("fs").promises
Object.assign(global, require("../utils/global"))
const serviceAccount = require(settings.serviceAccountPath)

let app
if(admin.apps.length > 0){
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    }, "cli-test")
} else {
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}

const Firestore = app.firestore()

describe("Performance test CLI", function() {
    this.timeout(600000)
    const backupPath = "./"+crypto.randomFillSync(Buffer.alloc(4)).toString("hex")+".backup"
    let newDoc
    let docArr = []
    const docData = {
        array: admin.firestore.FieldValue.arrayUnion("a","b"),
        map: {
            number: 1,
            string: "test",
            null: null,
            boolean: true,
            timestamp: admin.firestore.Timestamp.fromMillis(Date.now()),
            ref: Firestore.collection("test").doc(),
            geopoint: new admin.firestore.GeoPoint(1, 11),
            binary: Buffer.from("Test data")
        }
    }
    this.beforeAll(async () => {
        newDoc = Firestore.collection("test").doc()
        await newDoc.set(docData)
        for(let i = 0; i < 9999; i++){
            const _docRef = Firestore.collection("test").doc()
            docArr.push(_docRef.id)
            await _docRef.set(docData)
        }
        return
    })
    this.afterAll(async () => {
        await newDoc.delete().catch((err)=>{})
        for(let i = 0; i < docArr.length; i++){
            const _docRef = Firestore.collection("test").doc(docArr[i])
            await _docRef.delete()
        }
        await fsPromises.unlink(backupPath).catch((err)=>{})
    })
    /*
        backup all
    */
    it("Backup 10k firestore doc", async function(){      
        await fsPromises.unlink(backupPath).catch((err)=>{})
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"backup\"",
            "services=firestore",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        console.log(log)
        const files = await fsPromises.readdir("./")
        const errors = []
        if(files.indexOf(path.basename(backupPath)) === -1)
            errors.push("Backup file not found!")
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        clean all
    */
    it("Clean 10k firestore doc", async function(){      
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"clean\"",
            "services=firestore",
            "path=\""+settings.serviceAccountPath+"\""
        ])
        console.log(log)
        const collections = await Firestore.listCollections()
        const errors = []
        if(Array.isArray(collections) && (collections.length !== 0))
            errors.push("Firestore is not empty!")
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        restore all
    */
    it("Restore 10k firestore doc", async function(){      
        const _files = await fsPromises.readdir("./")
        if(_files.indexOf(path.basename(backupPath)) === -1)
            throw new Error("Backup file not found!")
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"restore\"",
            "services=firestore",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        console.log(log)
        const collections = await Firestore.listCollections()
        const errors = []
        breakDoc: if(Array.isArray(collections) && (collections.length === 0)){
            errors.push("Firestore is empty!")
        } else {
            const _docSnap = await newDoc.get()
            if(!_docSnap.exists){
                errors.push("Document is not exists!")
                break breakDoc
            }
            const _docData = _docSnap.data()
            if(!_docData){
                errors.push("Document is empty!")
                break breakDoc
            }
            if(
                (!Array.isArray(_docData.array)) ||
                (_docData.array.indexOf("a") === -1) ||
                (_docData.array.indexOf("b") === -1) ||
                (_docData.array.length !== 2) ||
                (_docData.map.number !== docData.map.number) ||
                (_docData.map.string !== docData.map.string) ||
                (_docData.map.null !== docData.map.null) ||
                (_docData.map.boolean !== docData.map.boolean) ||
                (_docData.map.timestamp.toMillis() !== docData.map.timestamp.toMillis()) ||
                (_docData.map.ref.id !== docData.map.ref.id) ||
                (_docData.map.geopoint.latitude !== docData.map.geopoint.latitude) ||
                (_docData.map.geopoint.longitude !== docData.map.geopoint.longitude) ||
                (!(_docData.map.binary instanceof Buffer)) ||
                (docData.map.binary.equals(_docData.map.binary) !== true)
            )
                errors.push("User data not equal!")
        }
        const collectionSnap = await Firestore.collection("test").get()
        if(collectionSnap.size !== 10000){
            console.log(collectionSnap.size)
            errors.push("Invalid restored collection size!")
        }
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
})