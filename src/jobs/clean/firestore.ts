import { firestore as Firestore, app } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"

export class JobCleanFirestore extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
    }
    private static batchSize: number = 100
    private firestore: Firestore.Firestore = Firestore()
    private batch: Firestore.WriteBatch = this.firestore.batch()
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
        console.log(" - Firestore Clean Complete!")
        return
    }
}