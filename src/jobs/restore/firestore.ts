import { app, firestore as Firestore } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate } from "../../utils/template"
import { createReadStream, ReadStream } from "fs"
import { createGunzip, Gunzip } from "zlib"
const Objectstream = require("@sergdudko/objectstream")
import { Transform, Writable } from "stream"
import { FirestoreConverter } from "../../utils/FirestoreConverter"

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
            write(object, encoding, callback) {
                (async () => {
                    if(
                        (object.service !== "firestore") ||
                        (typeof(object.path) !== "string") ||
                        (typeof(object.data) !== "string")
                    )
                        return
                    const docRef = self.Firestore.doc(object.path)
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
            console.warn(err)
        })
        this.gunzipStream.on("error", (err) => {
            console.warn(err)
        })
        this.parserStream.on("error", (err) => {
            console.warn(err)
        })
        this.writeStream.on("error", (err) => {
            console.warn(err)
        })
    }
    private Firestore: Firestore.Firestore = Firestore() 
    private fileStream: ReadStream
    private gunzipStream: Gunzip
    private parserStream: Transform
    private writeStream: Writable
    private writeBuffer = {
        batchSize: 100,
        iteration: 0,
        batch: this.Firestore.batch(),
        clear: async () => {
            this.writeBuffer.iteration = 1
            this.writeBuffer.batch = this.Firestore.batch()
            return this.writeBuffer
        },
        commit: async () => {
            await this.writeBuffer.batch.commit()
            await this.writeBuffer.clear()
            return this.writeBuffer
        },
        set: async (ref: Firestore.DocumentReference, data: {[key: string]: any}) => {
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
            //this.fileStream.pipe(this.parserStream).pipe(this.writeStream)
            this.writeStream.on("finish", () => {
                console.log(" - Firestore Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}