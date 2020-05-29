import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupSRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreFirestore extends JobBackupSRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        const self = this
        this.writeStream = new Writable({
            write(object: DataModel, encoding, callback) {
                (async () => {
                    if(
                        (object.service !== "firestore") ||
                        (typeof(object.path) !== "string") ||
                        (typeof(object.data) !== "string")
                    )
                        return
                    const docRef = self.firestore.doc(object.path)
                    const docData = FirestoreConverter.fromString(object.data)
                    await self.writeBuffer.set(docRef, docData)
                    return
                })().then(() => {
                    callback()
                    return
                }).catch((err) => {
                    callback(err)
                    return
                })			
            },
            objectMode: true
        })
        this.writeStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore = this.admin.firestore()
    /**
     * write document to project stream
     */
    private writeStream: Writable
    /**
     * buffer for write to project
     */
    private writeBuffer = {
        /**
         * batch size
         */
        batchSize: 100,
        /**
         * iteration
         */
        iteration: 0,
        /**
         * batch object
         */
        batch: this.firestore.batch(),
        /**
         * clear this buffer
         */
        clear: async () => {
            this.writeBuffer.iteration = 1
            this.writeBuffer.batch = this.firestore.batch()
            return this.writeBuffer
        },
        /**
         * write this buffer to project and clean it
         */
        commit: async () => {
            await this.writeBuffer.batch.commit()
            await this.writeBuffer.clear()
            return this.writeBuffer
        },
        /**
         * add document to this buffer
         */
        set: async (ref: Firestore.DocumentReference, data: {[key: string]: any}) => {
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Firebase Restored - "+this.counter+" docs in "+this.getWorkTime()+".")
            ++this.writeBuffer.iteration
            this.writeBuffer.batch.set(ref, data)
            if(this.writeBuffer.iteration === this.writeBuffer.batchSize){
                await this.writeBuffer.commit()
            }
            return this.writeBuffer
        }
    }
    /**
     * job runner
     */
    public run = async () => {
        this.startTimestamp = Date.now()
        await new Promise((res, rej) => {
            if(this.gunzipStream){
                const gunzip = this.gunzipStream
                this.gunzipStream.on("unpipe", () => {
                    gunzip.unpipe(this.parserStream)
                    gunzip.close()
                    this.parserStream.end()
                })
                this.fileStream.pipe(gunzip).pipe(this.parserStream).pipe(this.writeStream)
            } else {
                this.fileStream.pipe(this.parserStream).pipe(this.writeStream)
            }
            this.writeStream.on("finish", () => {
                Logger.log(" -- Firebase Restored - "+this.counter+" docs in "+this.getWorkTime()+".")
                Logger.log(" - Firestore Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}