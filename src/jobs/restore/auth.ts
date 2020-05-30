import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupSRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { AuthConverter } from "../../utils/AuthConverter"
import { Logger } from "../../utils/Logger"

export class JobRestoreAuth extends JobBackupSRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings: Settings, admin: app.App){
        super(settings, admin)
        this.auth = this.admin.auth()
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
                    let userData
                    if(self.settings.hash_config)
                        userData = AuthConverter.fromString(object.data, true)
                    else
                        userData = AuthConverter.fromString(object.data, false)
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
        this.writeStream.on("error", (err) => {
            Logger.warn(err)
        })
    }
    /**
     * firebase auth app
     */
    private auth: Auth.Auth
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
            let res
            if(this.settings.hash_config)
                res = await this.auth.importUsers(this.writeBuffer.batch, {
                    hash: this.settings.hash_config
                })
            else
                res = await this.auth.importUsers(this.writeBuffer.batch)
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
                Logger.log(" -- Auth Restored - "+this.counter+" users in "+this.getWorkTime()+".")
                Logger.log(" - Auth Restore Complete!")
                res()
            })
        })
        await this.writeBuffer.commit()
        return
    }
}