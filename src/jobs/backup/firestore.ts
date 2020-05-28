import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceTemplate, DataModel } from "../../utils/template"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"

export class JobBackupFirestore extends JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.firestore = this.admin.firestore() 
    }
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore
    /**
     * backup one document function
     */
    private documentBackup = async (ref: Firestore.DocumentReference) => {
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Firestore Backuped - "+this.counter+" docs in "+this.getWorkTime()+".")
        const docSnap = await ref.get()
        if(!docSnap.exists)
            return
        const docData = docSnap.data()
        if(!docData)
            return
        const docString = FirestoreConverter.toString(docData)
        const _doc: DataModel = {
            service: "firestore",
            path: ref.path,
            data: docString
        }
        await new Promise((res, rej) => {
            this.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                if(err) Logger.warn(err)
                res()
            })
        })
        return
    }
    /**
     * recursive backup function
     */
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
    /**
     * job runner
     */
    public run = async () => {
        this.startTimestamp = Date.now()     
        await new Promise(async (res, rej) => {
            try {
                this.stringiferStream.pipe(this.writer.gzipStream)
                this.writer.gzipStream.once("unpipe", () => {
                    Logger.log(" -- Firestore Backuped - "+this.counter+" docs in "+this.getWorkTime()+".")
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