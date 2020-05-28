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
            const arr = [Promise.resolve()];
            for (const key in initialization_1.writers) {
                const writer = initialization_1.writers[key];
                const promise = new Promise((res, rej) => {
                    writer.fileStream.on("finish", () => {
                        res();
                    });
                    writer.gzipStream.end();
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