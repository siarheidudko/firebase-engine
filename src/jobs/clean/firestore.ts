import { firestore as Firestore, app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobCleanFirestore extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
        this.firestore = this.admin.firestore()
        this.batch = this.firestore.batch()
    }
    /**
     * document on one batch
     */
    private static batchSize: number = 100
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore
    /**
     * batch object
     */
    private batch: Firestore.WriteBatch
    /**
     * commit batch and recreate
     */
    private batchClean = async (arr: Firestore.DocumentReference[]) => {
        for(const ref of arr){
            this.batch.delete(ref)
            await this.recursiveClean(ref)
        }
        await this.batch.commit()
        this.batch = this.firestore.batch()
        return
    }
    /**
     * recursive clean function
     */
    private recursiveClean = async (ref: Firestore.Firestore | Firestore.DocumentReference) => {
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
            let _arr: Firestore.DocumentReference[] = []
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                ++this.counter
                if((this.counter % 100) === 0)
                    Logger.log(" -- Firestore Cleaned - "+this.counter+" docs in "+this.getWorkTime()+".")
                    _arr.push(collectionSnap.docs[i-1].ref)
                if(
                    ((i % JobCleanFirestore.batchSize) === 0) || 
                    (i === collectionSnap.docs.length)
                ){
                    await this.batchClean(_arr)
                    _arr = []
                }
            }
        }
        return
    }
    /**
     * job runner
     */
    public run = async () => {
        this.startTimestamp = Date.now()
        await this.recursiveClean(this.firestore)
        Logger.log(" -- Firestore Cleaned - "+this.counter+" docs in "+this.getWorkTime()+".")
        Logger.log(" - Firestore Clean Complete!")
        return
    }
}