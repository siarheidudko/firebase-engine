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
        if(this.settings.emulators)
            this.firestore.settings({
                host: "localhost:8080",
                ssl: false
            })
    }
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore
    /**
     * backup one document function
     */
    private async documentBackup(docSnap: Firestore.DocumentData){
        const docData = docSnap.data()
        if(!docData)
            return
        const docString = FirestoreConverter.toString(docData)
        const _doc: DataModel = {
            service: "firestore",
            path: docSnap.ref.path,
            data: docString
        }
        const self = this
        await new Promise((res, rej) => {
            self.stringiferStream.write(_doc, undefined, (err: Error|null|undefined)=>{
                if(err) Logger.warn(err)
                res()
            })
        })
        ++this.counter
        if((this.counter % 500) === 0)
            Logger.log(" -- Firestore Backuped - "+this.counter+" docs in "+this.getWorkTime()+".")
        return
    }
    /**
     * recursive backup function
     */
    private async recursiveBackup(ref: Firestore.Firestore|Firestore.DocumentReference){
        const collections = await ref.listCollections()
        for(const collectionRef of collections){
            let denied: boolean = true
            if(this.settings.collections.length !== 0){
                const arr: string[] = collectionRef.path.split("/")
                let str: string = ""
                for(let i = 0; i < arr.length; i++)if((i % 2) === 0){
                    str += arr[i]
                    if(this.settings.collections.indexOf(str) !== -1){
                        denied = false
                        break
                    }
                    str +="."
                }
            } else denied = false           
            const collectionSnap = await collectionRef.get()
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                if(!denied)  await this.documentBackup(collectionSnap.docs[i-1])
                await this.recursiveBackup(collectionSnap.docs[i-1].ref)
            }           
        }
        return
    }
    /**
     * job runner
     */
    public async run(){
        this.startTimestamp = Date.now()
        let _write: Gzip|WriteStream
        if(this.writer.gzipStream){
            _write = this.writer.gzipStream
        } else {
            _write = this.writer.fileStream
        }
        const self = this
        const unpipe = new Promise((res, rej) => {
            _write.once("unpipe", () => {
                if((self.counter % 500) !== 0)
                    Logger.log(" -- Firestore Backuped - "+self.counter+" docs in "+self.getWorkTime()+".")
                Logger.log(" - Firestore Backup Complete!")
                res()
            })
        })
        this.stringiferStream.pipe(_write)
        await this.recursiveBackup(this.firestore)
        this.stringiferStream.unpipe(_write)
        await unpipe
        return
    }
}