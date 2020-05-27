import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobOneServiceTemplate, DataModel } from "../../utils/template"
import { createReadStream, ReadStream } from "fs"
import { createGunzip, Gunzip } from "zlib"
const Objectstream = require("@sergdudko/objectstream")
import { Transform, Writable } from "stream"
import { AuthConverter } from "../../utils/AuthConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreAuth extends JobOneServiceTemplate {
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
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
                        (object.service !== "auth") ||
                        (typeof(object.path) !== "string") ||
                        (typeof(object.data) !== "string")
                    )
                        return
                    const userRef = object.path
                    const userData = AuthConverter.fromString(object.data)
                    await self.writeBuffer.set(userRef, userData)
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
    private auth: Auth.Auth
    private fileStream: ReadStream
    private gunzipStream: Gunzip
    private parserStream: Transform
    private writeStream: Writable
    private writeBuffer = {
        batchSize: 100,
        iteration: 0,
        batch: [] as {uid: string, [key: string]: any}[],
        clear: async () => {
            this.writeBuffer.iteration = 1
            this.writeBuffer.batch = []
            return this.writeBuffer
        },
        commit: async () => {
            await this.auth.importUsers(this.writeBuffer.batch)
            await this.writeBuffer.clear()
            return this.writeBuffer
        },
        set: async (ref: string, data: {uid: string, [key: string]: any}) => {
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Auth Restore - "+this.counter+" users.")
            ++this.writeBuffer.iteration
            this.writeBuffer.batch.push(data)
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
                Logger.log(" -- Auth Restore - "+this.counter+" users.")
                Logger.log(" - Auth Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}