"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Logger class
 */
let Logger = /** @class */ (() => {
    class Logger {
        /**
         * Log Table
         */
        static table(d) {
            setTimeout(() => {
                console.table(d);
            }, 0);
        }
    }
    /**
     * Log level
     */
    Logger.log = (d) => {
        setTimeout(() => {
            console.log(d);
        }, 0);
    };
    /**
     * Warning level
     */
    Logger.warn = (d) => {
        setTimeout(() => {
            console.warn(d);
        }, 0);
    };
    /**
     * Error level
     */
    Logger.error = (d) => {
        setTimeout(() => {
            console.error(d);
        }, 0);
    };
    return Logger;
})();
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map