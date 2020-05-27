"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
let Logger = /** @class */ (() => {
    class Logger {
        static table(d) {
            setTimeout(() => {
                console.table(d);
            }, 0);
        }
    }
    Logger.log = (d) => {
        setTimeout(() => {
            console.log(d);
        }, 0);
    };
    Logger.warn = (d) => {
        setTimeout(() => {
            console.warn(d);
        }, 0);
    };
    Logger.error = (d) => {
        setTimeout(() => {
            console.error(d);
        }, 0);
    };
    return Logger;
})();
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map