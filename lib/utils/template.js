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
         * Job runner
         */
        this.run = async () => {
            Logger_1.Logger.warn("Not supported.");
            return;
        };
    }
}
exports.JobOneServiceTemplate = JobOneServiceTemplate;
//# sourceMappingURL=template.js.map