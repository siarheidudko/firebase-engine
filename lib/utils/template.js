"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBackupSRestoreTemplate = exports.JobBackupServiceTemplate = exports.JobOneServiceTemplate = exports.JobOneTemplate = exports.JobTemplate = void 0;
const Objectstream = require("@sergdudko/objectstream");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const initialization_1 = require("./initialization");
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
/**
 * Job backup
 */
class JobBackupServiceTemplate extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        this.writer = initialization_1.createWriteFileStream(this.settings.backup);
        this.stringiferStream = new Objectstream.Stringifer();
        this.stringiferStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobBackupServiceTemplate = JobBackupServiceTemplate;
/**
 * Job restore
 */
class JobBackupSRestoreTemplate extends JobOneServiceTemplate {
    /**
     * @param settings - settings object
     * @param admin - firebase app
     */
    constructor(settings, admin) {
        super(settings, admin);
        this.fileStream = fs_1.createReadStream(this.settings.backup, {
            flags: "r",
            mode: 0o600,
            highWaterMark: 64 * 1024
        });
        this.gunzipStream = zlib_1.createGunzip();
        this.parserStream = new Objectstream.Parser();
        this.fileStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.gunzipStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.parserStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
    }
}
exports.JobBackupSRestoreTemplate = JobBackupSRestoreTemplate;
//# sourceMappingURL=template.js.map