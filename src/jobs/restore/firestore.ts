import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
import { createReadStream, ReadStream } from "fs"
import { createGunzip, Gunzip } from "zlib"
const Objectstream = require("@sergdudko/objectstream")
import { Transform, Writable } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreFirestore extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.fileStream = createReadStream(this.settings.backup, {
            flags: "r", 
            mode: 0o600, 
            highWaterMark: 64*1024
        })
        this.gunzipStream = createGunzip()
        this.parserStream = new Objectstream.Parser() as Transform
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
        this.fileStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.gunzipStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.parserStream.on("error", (err) => {
            Logger.warn(err)
        })
        this.writeStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    private counter: number = 0
    private firestore: Firestore.Firestore = this.admin.firestore()
    private fileStream: ReadStream
    private gunzipStream: Gunzip
    private parserStream: Transform
    private writeStream: Writable
    private writeBuffer = {
        batchSize: 100,
        iteration: 0,
        batch: this.firestore.batch(),
        clear: async () => {
            this.writeBuffer.iteration = 1
            this.writeBuffer.batch = this.firestore.batch()
            return this.writeBuffer
        },
        commit: async () => {
            await this.writeBuffer.batch.commit()
            await this.writeBuffer.clear()
            return this.writeBuffer
        },
        set: async (ref: Firestore.DocumentReference, data: {[key: string]: any}) => {
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Firebase Restore - "+this.counter+" docs.")
            ++this.writeBuffer.iteration
            this.writeBuffer.batch.set(ref, data)
            if(this.writeBuffer.iteration === this.writeBuffer.batchSize){
                await this.writeBuffer.commit()
            }
            return this.writeBuffer
        }
    }
    public run = async () => {
        await new Promise((res, rej) => {
            this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream)
            this.writeStream.on("finish", () => {
                Logger.log(" -- Firebase Restore - "+this.counter+" docs.")
                Logger.log(" - Firestore Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}