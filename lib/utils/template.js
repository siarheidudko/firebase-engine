"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOneServiceTemplate = exports.JobOneTemplate = exports.JobTemplate = void 0;
const Logger_1 = require("./Logger");
/**
 * Job Template Class
 */
class JobTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        this.settings = settings;
        this.admin = admin;
    }
}
exports.JobTemplate = JobTemplate;
/**
 * Job One Template Class
 */
class JobOneTemplate extends JobTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * Jobs for Firebase.Firestore
         */
        this.firestore = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
        /**
         * Jobs for Firebase.Auth
         */
        this.auth = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
        /**
         * Jobs for Firebase.Storage
         */
        this.storage = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneTemplate = JobOneTemplate;
/**
 * Job class
 */
class JobOneServiceTemplate extends JobTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        /**
         * operation counter
         */
        this.counter = 0;
        /**
         * get work time
         */
        this.getWorkTime = () => {
            const time = Date.now() - this.startTimestamp;
            if (time < 5000)
                return time + " ms";
            if (time < 300000)
                return Number.parseInt((time / 1000).toFixed()) + " sec";
            return Number.parseInt((time / 60000).toFixed()) + " min";
        };
        /**
         * Job runner
         */
        this.run = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
        this.startTimestamp = Date.now();
    }
}
exports.JobOneServiceTemplate = JobOneServiceTemplate;
//# sourceMappingURL=template.js.map