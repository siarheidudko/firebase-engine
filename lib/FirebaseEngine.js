"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseEngine = void 0;
const initialization_1 = require("./utils/initialization");
const Jobs_1 = require("./jobs/Jobs");
class FirebaseEngine {
    constructor(settings, admin) {
        const init = initialization_1.initialization(settings);
        this.settings = init.settings;
        this.admin = init.admin;
        this.jobs = new Jobs_1.Jobs(this.settings, this.admin);
    }
}
exports.FirebaseEngine = FirebaseEngine;
//# sourceMappingURL=FirebaseEngine.js.map