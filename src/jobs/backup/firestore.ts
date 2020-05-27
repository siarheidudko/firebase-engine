import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { createWriteStream, WriteStream } from "fs"
import { createGzip, Gzip } from "zlib"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"

export class JobBackupFirestore extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.fileStream = createWriteStream(this.settings.backup, {
            flags: "w", 
            mode: 0o600
        })
        this.gzipStream = createGzip()
        this.stringiferStream = new Objectstream.Stringifer("\n","\n","\n") as Transform
        this.stringiferStream.on("error", (err) => {
            console.warn(err)
        })
        this.gzipStream.on("error", (err) => {
            console.warn(err)
        })
        this.fileStream.on("error", (err) => {
            console.warn(err)
        })
    }
    private Firestore: Firestore.Firestore = Firestore() 
    private fileStream: WriteStream
    private gzipStream: Gzip
    private stringiferStream: Transform
    private documentBackup = async (ref: Firestore.DocumentReference) => {
        const docSnap = await ref.get()
        if(!docSnap.exists)
            return
        const docData = docSnap.data()
        if(!docData)
            return
        const docJson = FirestoreConverter.toString(docData)
        const _doc = {
            service: "firestore",
            path: ref.path,
            data: docJson
        }
        await new Promise((res, rej) => {
            this.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                if(err) console.warn(err)
                res()
            })
        })
        return
    }
    private recursiveBackup = async (ref: Firestore.Firestore|Firestore.DocumentReference) => {
        const collections = await ref.listCollections()
        for(const collectionRef of collections){
            const collectionSnap = await collectionRef.get()
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                await this.documentBackup(collectionSnap.docs[i-1].ref)
                await this.recursiveBackup(collectionSnap.docs[i-1].ref)
            }
        }
        return
    }
    public run = async () => {        
        await new Promise(async (res, rej) => {
            this.stringiferStream.pipe(this.gzipStream).pipe(this.fileStream)
            //this.stringiferStream.pipe(this.fileStream)
            this.fileStream.on("finish", () => {
                console.log(" - Firestore Backup Complete!")
                res()
            })
            await this.recursiveBackup(this.Firestore)
            this.stringiferStream.end()
        })
        return
    }
}