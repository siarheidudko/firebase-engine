import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobRestoreFirestore extends JobBackupServiceRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
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
                    if(self.settings.collections.length !== 0){
                        const arr: string[] = object.path.split("/")
                        let str: string = ""
                        let denied: boolean = true
                        for(let i = 0; i < arr.length; i++)if((i % 2) === 0){
                            str += arr[i]
                            if(self.settings.collections.indexOf(str) !== -1){
                                denied = false
                                break
                            }
                            str +="."
                        }
                        if(denied) return
                    }
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
        this.firestore = this.admin.firestore()
        if(this.settings.emulators)
            this.firestore.settings({
                host: "localhost:8080",
                ssl: false
            })
        this.writeBuffer = {
            batchSize: 500,
            iteration: 0,
            batch: self.firestore.batch(),
            clear: async () => {
                self.writeBuffer.batch = self.firestore.batch()
                return self.writeBuffer
            },
            commit: async () => {
                const result = await self.writeBuffer.batch.commit()
                self.counter += result.length
                await self.writeBuffer.clear()
                Logger.log(" -- Firebase Restored - "+self.counter+" docs in "+self.getWorkTime()+".")
                return self.writeBuffer
            },
            set: async (ref: Firestore.DocumentReference, data: {[key: string]: any}) => {
                self.writeBuffer.batch.set(ref, data)
                ++self.writeBuffer.iteration
                if((self.writeBuffer.iteration % self.writeBuffer.batchSize) === 0){
                    await self.writeBuffer.commit()
                }
                return self.writeBuffer
            }
        }
    }
    /**
     * firebase firestore app
     */
    private firestore: Firestore.Firestore
    /**
     * write document to project stream
     */
    private writeStream: Writable
    /**
     * buffer for write to project
     */
    private writeBuffer: {
        /**
         * batch size
         */
        batchSize: number,
        /**
         * iteration
         */
        iteration: number,
        /**
         * Firestore Writebatch
         */
        batch: Firestore.WriteBatch,
        /**
         * clean this buffer
         */
        clear: Function,
        /**
         * write this buffer to project and clean it
         */
        commit: Function,
        /**
         * add document to this buffer
         */
        set: Function
    }
    /**
     * job runner
     */
    public async run(){
        this.startTimestamp = Date.now()
        const self = this
        await new Promise((res, rej) => {
            if(self.gunzipStream){
                const gunzip = self.gunzipStream
                self.gunzipStream.on("unpipe", () => {
                    gunzip.unpipe(self.parserStream)
                    gunzip.close()
                    self.parserStream.end()
                })
                self.fileStream.pipe(gunzip).pipe(self.parserStream).pipe(self.writeStream)
            } else {
                self.fileStream.pipe(self.parserStream).pipe(self.writeStream)
            }
            self.writeStream.on("finish", () => {
                res()
            })
        })
        if((this.writeBuffer.iteration % this.writeBuffer.batchSize) !== 0)
            await this.writeBuffer.commit()
        await new Promise((res) => { setTimeout(res, 1) })
        Logger.log(" - Firestore Restore Complete!")
        return
    }
}