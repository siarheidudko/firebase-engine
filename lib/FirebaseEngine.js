"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseEngine = void 0;
const initialization_1 = require("./utils/initialization");
const Jobs_1 = require("./jobs/Jobs");
/**
 * Firebase Engine to copy data
 */
class FirebaseEngine {
    /**
     * @param settings - settings object
     */
    constructor(settings) {
        /**
         * Call this before exiting
         */
        this.exit = async () => {
            const arr = [];
            for (const key in initialization_1.writers) {
                const writer = initialization_1.writers[key];
                const promise = new Promise((res, rej) => {
                    if (writer.fileStream.destroyed) {
                        res();
                        return;
                    }
                    writer.fileStream.once("finish", () => {
                        res();
                    });
                    if (writer.gzipStream && !writer.gzipStream.destroyed)
                        writer.gzipStream.end();
                    else if (!writer.fileStream.destroyed)
                        writer.fileStream.end();
                    else
                        res();
                });
                arr.push(promise);
            }
            await Promise.all(arr);
            return;
        };
        const init = initialization_1.initialization(settings);
        this.settings = init.settings;
        this.admin = init.admin;
        this.jobs = new Jobs_1.Jobs(this.settings, this.admin);
    }
}
exports.FirebaseEngine = FirebaseEngine;
//# sourceMappingURL=FirebaseEngine.js.map