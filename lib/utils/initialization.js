"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialization = exports.cmdParser = exports.Writer = exports.createWriteFileStream = exports.writers = void 0;
const fs_1 = require("fs");
const firebase_admin_1 = require("firebase-admin");
const zlib_1 = require("zlib");
const Logger_1 = require("../utils/Logger");
const crypto_1 = require("crypto");
/**
 * Module store (to prevent secondary initialization)
 */
const store = {};
/**
 * write streams
 */
exports.writers = {};
/**
 * Create write stream
 *
 * @param path - path to file for write
 */
exports.createWriteFileStream = (path, compress) => {
    const hash = crypto_1.createHash("sha1");
    hash.update(path);
    const key = hash.digest("hex");
    if (!exports.writers[key] ||
        exports.writers[key].fileStream.destroyed)
        exports.writers[key] = new Writer(path, compress);
    return exports.writers[key];
};
/**
 * Writer Class for create write streams
 */
class Writer {
    /**
     *
     * @param path - path to file for write
     */
    constructor(path, compress) {
        /**
         * use compress
         */
        this.compress = false;
        this.fileStream = fs_1.createWriteStream(path, {
            flags: "w",
            mode: 0o600
        });
        this.fileStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        if (compress) {
            this.compress = true;
            this.gzipStream = zlib_1.createGzip();
            this.gzipStream.on("error", (err) => {
                Logger_1.Logger.warn(err);
            });
            this.gzipStream.pipe(this.fileStream);
        }
    }
}
exports.Writer = Writer;
/**
 * Command Line Parser
 */
exports.cmdParser = (arg) => {
    /**
     * Settings object
     */
    const settings = {
        operations: [],
        path: undefined,
        backup: undefined,
        services: [],
        compress: true
    };
    arg.forEach((val) => {
        if (val.match(/^path=/i) || val.match(/^p=/i))
            settings.path = val.replace(/^p=/i, "").replace(/^path=/i, "").replace(/"/g, "");
        if (val.match(/^backup=/i) || val.match(/^b=/i))
            settings.backup = val.replace(/^b=/i, "").replace(/^backup=/i, "").replace(/"/g, "");
        if (val.match(/^operations=/i) || val.match(/^o=/i)) {
            const _operation = val.replace(/^o=/i, "").replace(/^operations=/i, "").replace(/"/g, "").replace(/\s/g, "").split(",");
            for (const _o of _operation)
                switch (_o) {
                    case "backup":
                    case "clean":
                    case "restore":
                        settings.operations.push(_o);
                        break;
                    case "b":
                        settings.operations.push("backup");
                        break;
                    case "c":
                        settings.operations.push("clean");
                        break;
                    case "r":
                        settings.operations.push("restore");
                        break;
                    default:
                        break;
                }
        }
        if (val.match(/^services=/i) || val.match(/^s=/i)) {
            const _service = val.replace(/^s=/i, "").replace(/^services=/i, "").replace(/"/g, "").replace(/\s/g, "").split(",");
            for (const _s of _service)
                switch (_s) {
                    case "firestore":
                    case "auth":
                    case "storage":
                        settings.services.push(_s);
                        break;
                    case "f":
                        settings.services.push("firestore");
                        break;
                    case "a":
                        settings.services.push("auth");
                        break;
                    case "s":
                        settings.services.push("storage");
                        break;
                    case "all":
                        settings.services.push("auth");
                        settings.services.push("firestore");
                        settings.services.push("storage");
                        break;
                    default:
                        break;
                }
        }
        if (val.match(/^--nocompress/i) || val.match(/^-nc/i))
            settings.compress = false;
    });
    if (settings.operations.length === 0)
        settings.operations.push("backup");
    if (settings.services.length === 0)
        settings.services = [
            "auth",
            "firestore",
            "storage"
        ];
    return settings;
};
/**
 * App initialization
 *
 * @param settings - settings object
 */
exports.initialization = (settings = {
    path: undefined,
    backup: undefined,
    compress: true
}) => {
    if (store.settings && store.admin)
        return store;
    const _settings = {
        path: settings.path,
        backup: settings.backup,
        compress: settings.compress
    };
    if (typeof (_settings.path) !== "string")
        throw new Error("Service account path not set.");
    if ((typeof (_settings.backup) !== "undefined") &&
        (typeof (_settings.backup) !== "string"))
        throw new Error("Invalid backup argument.");
    if (typeof (_settings.compress) !== "boolean")
        throw new Error("Invalid backup argument.");
    store.settings = Object.assign(Object.assign({}, _settings), { serviceAccount: JSON.parse(fs_1.readFileSync(_settings.path).toString()) });
    if (!store.settings.backup)
        store.settings.backup = store.settings.serviceAccount.project_id + "_" + Date.now().toString() + ".backup";
    if (!store.admin) {
        const initializationConfig = {
            databaseURL: "https://" + store.settings.serviceAccount.project_id + ".firebaseio.com",
            storageBucket: store.settings.serviceAccount.project_id + ".appspot.com",
            projectId: store.settings.serviceAccount.project_id,
            credential: firebase_admin_1.credential.cert(store.settings.serviceAccount)
        };
        if (firebase_admin_1.apps.length > 0) {
            const appName = crypto_1.randomFillSync(Buffer.alloc(16)).toString("hex");
            store.admin = firebase_admin_1.initializeApp(initializationConfig, appName);
        }
        else {
            store.admin = firebase_admin_1.initializeApp(initializationConfig);
        }
    }
    return store;
};
//# sourceMappingURL=initialization.js.map