import { app, firestore as Firestore } from "firebase-admin"
import { Settings, Writer, createWriteFileStream } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
const Objectstream = require("@sergdudko/objectstream")
import { Transform } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupFirestore extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.firestore = this.admin.firestore() 
        this.writer = createWriteFileStream(this.settings.backup)
        this.stringiferStream = new Objectstream.Stringifer() as Transform
        this.stringiferStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    private counter: number = 0
    private firestore: Firestore.Firestore
    private writer: Writer
    private stringiferStream: Transform
    private documentBackup = async (ref: Firestore.DocumentReference) => {
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Firestore Backup - "+this.counter+" docs.")
        const docSnap = await ref.get()
        if(!docSnap.exists)
            return
        const docData = docSnap.data()
        if(!docData)
            return
        const docJson = FirestoreConverter.toString(docData)
        const _doc: DataModel = {
            service: "firestore",
            path: ref.path,
            data: docJson
        }
        await new Promise((res, rej) => {
            this.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                if(err) Logger.warn(err)
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
            try {
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.on("unpipe", () => {
                    Logger.log(" -- Firestore Backup - "+this.counter+" docs.")
                    Logger.log(" - Firestore Backup Complete!")
                    res()
                })
                await this.recursiveBackup(this.firestore)
                this.stringiferStream.unpipe(this.writer.gzipStream)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}