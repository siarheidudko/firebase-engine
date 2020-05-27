import { firestore as Firestore, app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { Logger } from "../../utils/Logger"

export class JobCleanFirestore extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.firestore = this.admin.firestore()
        this.batch = this.firestore.batch()
    }
    private counter: number = 0
    private static batchSize: number = 100
    private firestore: Firestore.Firestore
    private batch: Firestore.WriteBatch
    private batchClean = async (arr: Firestore.DocumentReference[]) => {
        for(const ref of arr){
            this.batch.delete(ref)
            await this.recursiveClean(ref)
        }
        await this.batch.commit()
        this.batch = this.firestore.batch()
        return
    }
    private recursiveClean = async (ref: Firestore.Firestore | Firestore.DocumentReference) => {
        const collections = await ref.listCollections()
        for(const collectionRef of collections){
            const collectionSnap = await collectionRef.get()
            let arr: Firestore.DocumentReference[] = []
            for(let i = 1; i <= collectionSnap.docs.length; i++){
                ++this.counter
                if((this.counter % 100) === 0)
                    Logger.log(" -- Firestore Clean - "+this.counter+" docs.")
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
    public run = async () => {
        await this.recursiveClean(this.firestore)
        Logger.log(" -- Firestore Clean - "+this.counter+" docs.")
        Logger.log(" - Firestore Clean Complete!")
        return
    }
}