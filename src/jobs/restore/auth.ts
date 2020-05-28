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
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
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
    /**
     * firebase auth app
     */
    private auth: Auth.Auth
    /**
     * file read stream
     */
    private fileStream: ReadStream
    /**
     * unzip stream
     */
    private gunzipStream: Gunzip
    /**
     * string to object stream
     */
    private parserStream: Transform
    /**
     * write user to project stream
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
         * array of user
         */
        batch: [] as {uid: string, [key: string]: any}[],
        /**
         * clear this buffer
         */
        clear: async () => {
            this.writeBuffer.iteration = 1
            this.writeBuffer.batch = []
            return this.writeBuffer
        },
        /**
         * write this buffer to project and clean it
         */
        commit: async () => {
            const res = await this.auth.importUsers(this.writeBuffer.batch)
            if(res.failureCount !== 0){
                this.counter -= res.failureCount
                Logger.warn(JSON.stringify(res.errors))
            }
            await this.writeBuffer.clear()
            return this.writeBuffer
        },
        /**
         * add user to this buffer
         */
        set: async (ref: string, data: {uid: string, [key: string]: any}) => {
            ++this.counter
            if((this.counter % 100) === 0)
                Logger.log(" -- Auth Restored - "+this.counter+" users in "+this.getWorkTime()+".")
            ++this.writeBuffer.iteration
            this.writeBuffer.batch.push(data)
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
            this.fileStream.pipe(this.gunzipStream).pipe(this.parserStream).pipe(this.writeStream)
            this.writeStream.on("finish", () => {
                Logger.log(" -- Auth Restored - "+this.counter+" users in "+this.getWorkTime()+".")
                Logger.log(" - Auth Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}