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
            batchSize: 1000,
            iteration: 0,
            batch: [],
            clear: async () => {
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
                self.counter += res.successCount
                Logger.log(" -- Auth Restored - "+self.counter+" users in "+self.getWorkTime()+".")
                if(res.failureCount !== 0)
                    Logger.warn(JSON.stringify(res.errors))
                await self.writeBuffer.clear()
                return self.writeBuffer
            },
            set: async (ref: string, data: {uid: string, [key: string]: any}) => {  
                self.writeBuffer.batch.push(data)
                ++self.writeBuffer.iteration
                if((self.writeBuffer.iteration % self.writeBuffer.batchSize) === 0){
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
                Logger.log(" - Auth Restore Complete!")
                res()
            })
        })
        if((this.writeBuffer.iteration % this.writeBuffer.batchSize) !== 0)
            await this.writeBuffer.commit()
        return
    }
}