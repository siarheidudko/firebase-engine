import { app, auth as Auth } from "firebase-admin"
import { Settings } from "../../utils/initialization"
import { JobBackupServiceRestoreTemplate, DataModel } from "../../utils/template"
import { Writable } from "stream"
import { AuthConverter } from "../../utils/AuthConverter"
import { Logger } from "../../utils/Logger"
import { Storage } from "@google-cloud/storage"

export class JobRestoreAuth extends JobBackupServiceRestoreTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     * @param store - google cloud storage app
     */
    constructor(settings: Settings, admin: app.App, store: Storage){
        super(settings, admin, store)
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
        this.writeBuffer = {
            batchSize: 100,
            iteration: 0,
            batch: [],
            clear: async () => {
                self.writeBuffer.iteration = 1
                self.writeBuffer.batch = []
                return self.writeBuffer
            } ,
            commit: async () => {
                let res
                if(self.settings.hash_config)
                    res = await self.auth.importUsers(self.writeBuffer.batch, {
                        hash: self.settings.hash_config
                    })
                else
                    res = await self.auth.importUsers(self.writeBuffer.batch)
                if(res.failureCount !== 0){
                    self.counter -= res.failureCount
                    Logger.warn(JSON.stringify(res.errors))
                }
                await self.writeBuffer.clear()
                return self.writeBuffer
            },
            set: async (ref: string, data: {uid: string, [key: string]: any}) => {
                ++self.counter
                if((self.counter % 100) === 0)
                    Logger.log(" -- Auth Restored - "+self.counter+" users in "+self.getWorkTime()+".")
                ++self.writeBuffer.iteration
                self.writeBuffer.batch.push(data)
                if(self.writeBuffer.iteration === self.writeBuffer.batchSize){
                    await self.writeBuffer.commit()
                }
                return self.writeBuffer
            }
        }
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
         * array of user
         */
        batch: {uid: string, [key: string]: any}[],
        /**
         * clean this buffer
         */
        clear: Function,
        /**
         * write this buffer to project and clean it
         */
        commit: Function,
        /**
         * add user to this buffer
         */
        set: Function
    }
    /**
     * job runner
     */
    public async run(){
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