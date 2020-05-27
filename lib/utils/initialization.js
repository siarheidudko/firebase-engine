"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialization = exports.cmdParser = exports.Writer = exports.createWriteFileStream = exports.writers = void 0;
const fs_1 = require("fs");
const firebase_admin_1 = require("firebase-admin");
const zlib_1 = require("zlib");
const Logger_1 = require("../utils/Logger");
const crypto_1 = require("crypto");
const store = {};
exports.writers = {};
exports.createWriteFileStream = (path) => {
    const hash = crypto_1.createHash("sha1");
    hash.update(path);
    const key = hash.digest("hex");
    if (!exports.writers[key])
        exports.writers[key] = new Writer(path);
    return exports.writers[key];
};
class Writer {
    constructor(path) {
        this.fileStream = fs_1.createWriteStream(path, {
            flags: "w",
            mode: 0o600
        });
        this.gzipStream = zlib_1.createGzip();
        this.gzipStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.fileStream.on("error", (err) => {
            Logger_1.Logger.warn(err);
        });
        this.gzipStream.pipe(this.fileStream);
    }
}
exports.Writer = Writer;
exports.cmdParser = () => {
    const settings = {
        operations: [],
        path: undefined,
        backup: undefined,
        services: []
    };
    process.argv.forEach((val) => {
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
            serviceParser: for (const _s of _service)
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
                        settings.services = [
                            "auth",
                            "firestore",
                            "storage"
                        ];
                        break serviceParser;
                    default:
                        break;
                }
        }
    });
    return settings;
};
exports.initialization = (settings = {
    operations: [],
    path: undefined,
    backup: undefined,
    services: []
}) => {
    if (store.settings && store.admin)
        return store;
    const _settings = {
        operations: settings.operations,
        path: settings.path,
        backup: settings.backup,
        services: settings.services
    };
    if (!_settings.path) {
        throw new Error("Service account path not set.");
    }
    _settings.serviceAccount = JSON.parse(fs_1.readFileSync(_settings.path).toString());
    if (!_settings.backup)
        _settings.backup = _settings.serviceAccount.project_id + "_" + Date.now().toString() + ".backup";
    if (!store.admin)
        store.admin = firebase_admin_1.initializeApp({
            databaseURL: "https://" + _settings.serviceAccount.project_id + ".firebaseio.com",
            storageBucket: _settings.serviceAccount.project_id + ".appspot.com",
            projectId: _settings.serviceAccount.project_id,
            credential: firebase_admin_1.credential.cert(_settings.serviceAccount)
        });
    if (_settings.operations.length === 0)
        _settings.operations.push("backup");
    if (_settings.services.length === 0)
        _settings.services = [
            "auth",
            "firestore",
            "storage"
        ];
    store.settings = _settings;
    return store;
};
//# sourceMappingURL=initialization.js.map