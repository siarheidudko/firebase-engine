"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialization = exports.cmdParser = void 0;
const fs_1 = require("fs");
const firebase_admin_1 = require("firebase-admin");
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
    const admin = firebase_admin_1.initializeApp({
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
    return {
        settings: _settings,
        admin: admin
    };
};
//# sourceMappingURL=initialization.js.map