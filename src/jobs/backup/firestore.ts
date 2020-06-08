import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceTemplate, DataModel } from "../../utils/template"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"
import { Gzip } from "zlib"
import { WriteStream } from "fs"
import { Storage } from "@google-cloud/storage"

export class JobBackupFirestore extends JobBackupServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.firestore = this.admin.firestore() 
    }
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore
    /**
     * backup one document function
     */
    private documentBackup = async (docSnap: Firestore.DocumentData) => {
        ++this.counter
        if((this.counter % 100) === 0)
            Logger.log(" -- Firestore Backuped - "+this.counter+" docs in "+this.getWorkTime()+".")
        const docData = docSnap.data()
        if(!docData)
            return
        const docString = FirestoreConverter.toString(docData)
        const _doc: DataModel = {
            service: "firestore",
            path: docSnap.ref.path,
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
            if(this.settings.collections.length !== 0){
                const arr: string[] = collectionRef.path.split("/")
                let str: string = ""
                let denied: boolean = true
                for(let i = 0; i < arr.length; i++)if((i % 2) === 0){
                    str += arr[i]
                    if(this.settings.collections.indexOf(str) !== -1){
                        denied = false
                        break
                    }
                    str +="."
                }
                if(denied) continue
            }            
            const collectionSnap = await collectionRef.get()
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                await this.documentBackup(collectionSnap.docs[i-1])
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
                let _write: Gzip|WriteStream
                if(this.writer.gzipStream){
                    _write = this.writer.gzipStream
                } else {
                    _write = this.writer.fileStream
                }
                this.stringiferStream.pipe(_write)
                _write.once("unpipe", () => {
                    Logger.log(" -- Firestore Backuped - "+this.counter+" docs in "+this.getWorkTime()+".")
                    Logger.log(" - Firestore Backup Complete!")
                    res()
                })
                await this.recursiveBackup(this.firestore)
                this.stringiferStream.unpipe(_write)
            } catch (err) { 
                rej(err) 
            }
        })
        return
    }
}