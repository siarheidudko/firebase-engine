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
        if(this.settings.emulators)
            this.firestore.settings({
                host: "localhost:8080",
                ssl: false
            })
        this.batch = this.firestore.batch()
    }
    /**
     * document on one batch
     */
    private static batchSize: number = 500
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
    private async batchClean(arr: Firestore.DocumentReference[]){
        for(const ref of arr){
            let denied: boolean = true
            if(this.settings.collections.length !== 0){
                const _arr: string[] = ref.path.split("/")
                let str: string = ""
                for(let i = 0; i < _arr.length; i++)if((i % 2) === 0){
                    str += _arr[i]
                    if(this.settings.collections.indexOf(str) !== -1){
                        denied = false
                        break
                    }
                    str +="."
                }
            } else denied = false
            if(!denied)
                this.batch.delete(ref)
            await this.recursiveClean(ref)
        }
        const result = await this.batch.commit()
        this.counter += result.length
        Logger.log(" -- Firestore Cleaned - "+this.counter+" docs in "+this.getWorkTime()+".")
        this.batch = this.firestore.batch()
        return
    }
    /**
     * recursive clean function
     */
    private async recursiveClean(ref: Firestore.Firestore | Firestore.DocumentReference){
        const collections = await ref.listCollections()
        for(const collectionRef of collections){
            const collectionSnap = await collectionRef.get()
            let arr: Firestore.DocumentReference[] = []
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                arr.push(collectionSnap.docs[i-1].ref)
                if(
                    ((i % JobCleanFirestore.batchSize) === 0) || 
                    (i === collectionSnap.docs.length)
                ){
                    await this.batchClean(arr)
                    arr = []
                }
            }
        }
        return
    }
    /**
     * job runner
     */
    public async run(){
        this.startTimestamp = Date.now()
        await this.recursiveClean(this.firestore)
        Logger.log(" - Firestore Clean Complete!")
        return
    }
}