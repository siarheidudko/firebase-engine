"use strict"
require("mocha")
const settings = require("../utils/settings")
Object.assign(global, require("../utils/global"))

const cmdParser = require("../../lib/utils/initialization").cmdParser

describe("CLI parser", function() {
    it('firebase-engine o="c, r, b, c" s="f, a, s" p="./test/serviceAccount.json" b="./test.backup" -nc', async () => {
        const o = cmdParser([
            'firebase-engine',
            'o="c, r, b, c"',
            's="f, a, s"',
            'p="./test/serviceAccount.json"',
            'b="./test.backup"',
            '-nc'
        ])
        if(
            (typeof(o) !== "object") ||
            (!Array.isArray(o.operations)) ||
            (o.operations[0] !== "clean") ||
            (o.operations[1] !== "restore") ||
            (o.operations[2] !== "backup") ||
            (o.operations[3] !== "clean") ||
            (!Array.isArray(o.services)) ||
            (o.services[0] !== "firestore") ||
            (o.services[1] !== "auth") ||
            (o.services[2] !== "storage") ||
            (o.path !== "./test/serviceAccount.json") ||
            (o.backup !== "./test.backup") ||
            (o.compress !== false)
        )
            throw new Error("error")
        return
    })
    it('firebase-engine services="storage,auth,firestore" operations="backup,clean,restore" p="./serviceAccount.json" backup="./test/test.backup" --nocompress', async () => {
        const o = cmdParser([
            'firebase-engine',
            'services="storage,auth,firestore"',
            'operations="backup,clean,restore"',
            'p="./serviceAccount.json"',
            'backup="./test/test.backup"',
            '--nocompress'
        ])
        if(
            (typeof(o) !== "object") ||
            (!Array.isArray(o.operations)) ||
            (o.operations[0] !== "backup") ||
            (o.operations[1] !== "clean") ||
            (o.operations[2] !== "restore") ||
            (!Array.isArray(o.services)) ||
            (o.services[0] !== "storage") ||
            (o.services[1] !== "auth") ||
            (o.services[2] !== "firestore") ||
            (o.path !== "./serviceAccount.json") ||
            (o.backup !== "./test/test.backup") ||
            (o.compress !== false)
        )
            throw new Error("error")
        return
    })
    it('firebase-engine services="auth" operations="backup" p="./serviceAccount.json" backup="./test.backup"', async () => {
        const o = cmdParser([
            'firebase-engine',
            'services="auth"',
            'operations="backup"',
            'p="./serviceAccount.json"',
            'backup="./test.backup"'
        ])
        if(
            (typeof(o) !== "object") ||
            (!Array.isArray(o.operations)) ||
            (o.operations[0] !== "backup") ||
            (!Array.isArray(o.services)) ||
            (o.services[0] !== "auth") ||
            (o.path !== "./serviceAccount.json") ||
            (o.backup !== "./test.backup") ||
            (o.compress !== true)
        )
            throw new Error("error")
        return
    })
    it('firebase-engine o="c" p="./serviceAccount.json"', async () => {
        const o = cmdParser([
            'firebase-engine',
            'o="c"',
            'p="./serviceAccount.json"'
        ])
        if(
            (typeof(o) !== "object") ||
            (!Array.isArray(o.operations)) ||
            (o.operations[0] !== "clean") ||
            (!Array.isArray(o.services)) ||
            (o.services.indexOf("auth") === -1) ||
            (o.services.indexOf("firestore") === -1) ||
            (o.services.indexOf("storage") === -1) ||
            (o.path !== "./serviceAccount.json") ||
            (o.compress !== true)
        )
            throw new Error("error")
        return
    })
    it('firebase-engine path="./serviceAccount.json"', async () => {
        const o = cmdParser([
            'firebase-engine',
            'path="./serviceAccount.json"'
        ])
        if(
            (typeof(o) !== "object") ||
            (!Array.isArray(o.operations)) ||
            (o.operations[0] !== "backup") ||
            (!Array.isArray(o.services)) ||
            (o.services.indexOf("auth") === -1) ||
            (o.services.indexOf("firestore") === -1) ||
            (o.services.indexOf("storage") === -1) ||
            (o.path !== "./serviceAccount.json") ||
            (o.compress !== true)
        )
            throw new Error("error")
        return
    })
})