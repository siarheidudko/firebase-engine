"use strict"
require("mocha")
const admin = require("firebase-admin")
const path = require("path")
const settings = require("../utils/settings")
const fsPromises = require("fs").promises
Object.assign(global, require("../utils/global"))
const serviceAccount = require(settings.serviceAccountPath)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const Firestore = admin.firestore()
const Auth = admin.auth()
const Storage = admin.storage()
const Bucket = Storage.bucket(serviceAccount.project_id+".appspot.com")

describe("Integration test CLI", function() {
    this.timeout(300000)
    const backupPath = "./test.backup"
    let newDoc
    const docData = {
        array: admin.firestore.FieldValue.arrayUnion("a","b"),
        map: {
            number: 1,
            string: "test",
            null: null,
            boolean: true,
            timestamp: admin.firestore.Timestamp.fromMillis(Date.now()),
            ref: Firestore.collection("test").doc(),
            geopoint: new admin.firestore.GeoPoint(1, 11)
        }
    }
    const userData = { 
        uid:  "yZq3YOEDr7cXKtjnUjDpSJpwMBp1 ",
        email:  "sdudko@remedypointsolutions.com ",
        emailVerified: false,
        displayName: undefined,
        photoURL: undefined,
        phoneNumber: undefined,
        disabled: false,
        metadata:{ 
            lastSignInTime: null,
            creationTime:  "Thu, 28 May 2020 17:08:39 GMT " 
        },
        passwordHash: undefined,
        passwordSalt: undefined,
        customClaims: {
            isTest: true
        },
        tenantId: undefined,
        providerData:[ 
            { 
                uid:  "sdudko@remedypointsolutions.com ",
                displayName: undefined,
                email:  "sdudko@remedypointsolutions.com ",
                photoURL: undefined,
                providerId:  "password ",
                phoneNumber: undefined 
            } 
        ] 
    }
    const file = {
        name: "test.txt",
        data: Buffer.from("test")
    }
    this.beforeAll(async () => {
        newDoc = Firestore.collection("test").doc()
        await newDoc.set(docData)
        await Auth.importUsers([userData])
        const f = Bucket.file(file.name)
        await f.save(file.data)
        return
    })
    this.afterAll(async () => {
        await newDoc.delete().catch((err)=>{})
        await Auth.deleteUser(userData.uid).catch((err)=>{})
        const f = Bucket.file(file.name)
        await f.delete().catch((err)=>{})
    })
    /*
        backup firestore
    */
    it("node ./lib/bin/firebase-engine.js operations=\"backup\" service=\"firestore\" path=\""+settings.serviceAccountPath+"\" backup=\""+backupPath+"\"", async function(){      
        await fsPromises.unlink(backupPath).catch((err)=>{})
        await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"backup\"",
            "service=\"firestore\"",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        const files = await fsPromises.readdir("./")
        const errors = []
        if(files.indexOf(path.basename(backupPath)) === -1)
            errors.push("Backup file not found!")
        await fsPromises.unlink(backupPath).catch((err)=>{
            console.log(err.message)
        })
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        backup storage
    */
    it("node ./lib/bin/firebase-engine.js operations=\"backup\" service=\"storage\" path=\""+settings.serviceAccountPath+"\" backup=\""+backupPath+"\"", async function(){      
        await fsPromises.unlink(backupPath).catch((err)=>{})
        await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"backup\"",
            "service=\"storage\"",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        const files = await fsPromises.readdir("./")
        const errors = []
        if(files.indexOf(path.basename(backupPath)) === -1)
            errors.push("Backup file not found!")
        await fsPromises.unlink(backupPath).catch((err)=>{
            console.log(err.message)
        })
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        backup auth
    */
    it("node ./lib/bin/firebase-engine.js operations=\"backup\" service=\"auth\" path=\""+settings.serviceAccountPath+"\" backup=\""+backupPath+"\"", async function(){      
        await fsPromises.unlink(backupPath).catch((err)=>{})
        await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"backup\"",
            "service=\"auth\"",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        const files = await fsPromises.readdir("./")
        const errors = []
        if(files.indexOf(path.basename(backupPath)) === -1)
            errors.push("Backup file not found!")
        await fsPromises.unlink(backupPath).catch((err)=>{
            console.log(err.message)
        })
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        backup all
    */
    it("node ./lib/bin/firebase-engine.js operations=\"backup\" service=\"firestore, storage, auth\" path=\""+settings.serviceAccountPath+"\" backup=\""+backupPath+"\"", async function(){      
        await fsPromises.unlink(backupPath).catch((err)=>{})
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"backup\"",
            "service=\"firestore, storage, auth\"",
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
    it("node ./lib/bin/firebase-engine.js operations=\"clean\" service=\"all\" path=\""+settings.serviceAccountPath+"\"", async function(){      
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"clean\"",
            "service=\"all\"",
            "path=\""+settings.serviceAccountPath+"\""
        ])
        console.log(log)
        const collections = await Firestore.listCollections()
        const errors = []
        if(Array.isArray(collections) && (collections.length !== 0))
            errors.push("Firestore is not empty!")
        const users = await Auth.listUsers()
        if(Array.isArray(users) && (users.length !== 0))
            errors.push("Auth is not empty!")
        const [files] = await Bucket.getFiles()
        if(Array.isArray(files) && (files.length !== 0))
            errors.push("Storage is not empty!")
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
    /*
        restore all
    */
    it("node ./lib/bin/firebase-engine.js operations=\"restore\" path=\""+settings.serviceAccountPath+"\" backup=\""+backupPath+"\"", async function(){      
        const _files = await fsPromises.readdir("./")
        if(_files.indexOf(path.basename(backupPath)) === -1)
            throw new Error("Backup file not found!")
        const log = await childProcessPromise("node", [
            "./lib/bin/firebase-engine.js",
            "operations=\"restore\"",
            "path=\""+settings.serviceAccountPath+"\"",
            "backup=\""+backupPath+"\""
        ])
        console.log(log)
        const collections = await Firestore.listCollections()
        const errors = []
        if(Array.isArray(collections) && (collections.length === 0))
            errors.push("Firestore is empty!")
        const users = await Auth.listUsers()
        if(Array.isArray(users) && (users.length === 0))
            errors.push("Auth is empty!")
        const [files] = await Bucket.getFiles()
        if(Array.isArray(files) && (files.length === 0))
            errors.push("Storage is empty!")
        if(errors.length > 0)
            throw new Error(errors.join(", "))
        return
    })
})