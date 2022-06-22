"use strict";
require("mocha");
const settings = require("../utils/settings");
Object.assign(global, require("../utils/global"));

const cmdParser = require("../../lib/utils/initialization").cmdParser;

describe("CLI parser", function () {
  it('firebase-engine o="c, r, b, c" s="f, a, s" p="./test/serviceAccount.json" b="./test.backup" -nc -em', async () => {
    const o = cmdParser([
      "firebase-engine",
      'o="c, r, b, c"',
      's="f, a, s"',
      'p="./test/serviceAccount.json"',
      'b="./test.backup"',
      "-nc",
      "-em",
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "clean" ||
      o.operations[1] !== "restore" ||
      o.operations[2] !== "backup" ||
      o.operations[3] !== "clean" ||
      !Array.isArray(o.services) ||
      o.services[0] !== "firestore" ||
      o.services[1] !== "auth" ||
      o.services[2] !== "storage" ||
      o.path !== "./test/serviceAccount.json" ||
      o.backup !== "./test.backup" ||
      o.compress !== false ||
      o.emulators !== true
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine services="storage,auth,firestore" buck="test.appspot.com,test2" coll="authors,books.pages" operations="backup,clean,restore" p="./serviceAccount.json" backup="./test/test.backup" --nocompress --emulators', async () => {
    const o = cmdParser([
      "firebase-engine",
      'services="storage,auth,firestore"',
      'buck="test.appspot.com, test2"',
      'coll="authors,books.pages"',
      'operations="backup,clean,restore"',
      'p="./serviceAccount.json"',
      'backup="./test/test.backup"',
      "--nocompress",
      "--emulators",
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "backup" ||
      o.operations[1] !== "clean" ||
      o.operations[2] !== "restore" ||
      !Array.isArray(o.services) ||
      o.services[0] !== "storage" ||
      o.services[1] !== "auth" ||
      o.services[2] !== "firestore" ||
      o.path !== "./serviceAccount.json" ||
      o.backup !== "./test/test.backup" ||
      o.compress !== false ||
      o.emulators !== true ||
      !Array.isArray(o.buckets) ||
      o.buckets[0] !== "test.appspot.com" ||
      o.buckets[1] !== "test2" ||
      !Array.isArray(o.collections) ||
      o.collections[0] !== "authors" ||
      o.collections[1] !== "books.pages"
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine services="auth" operations="backup" p="./serviceAccount.json" backup="./test.backup"', async () => {
    const o = cmdParser([
      "firebase-engine",
      'services="auth"',
      'operations="backup"',
      'p="./serviceAccount.json"',
      'backup="./test.backup"',
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "backup" ||
      !Array.isArray(o.services) ||
      o.services[0] !== "auth" ||
      o.path !== "./serviceAccount.json" ||
      o.backup !== "./test.backup" ||
      o.compress !== true ||
      o.emulators !== false
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine services="firestore, storage" buckets="test" collections="test, test1.test2" operations="backup" p="./serviceAccount.json" backup="./test.backup"', async () => {
    const o = cmdParser([
      "firebase-engine",
      'services="firestore, storage"',
      'buckets="test"',
      'collections="test, test1.test2"',
      'operations="backup"',
      'p="./serviceAccount.json"',
      'backup="./test.backup"',
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "backup" ||
      !Array.isArray(o.services) ||
      o.services[0] !== "firestore" ||
      o.services[1] !== "storage" ||
      o.path !== "./serviceAccount.json" ||
      o.backup !== "./test.backup" ||
      o.compress !== true ||
      o.emulators !== false ||
      !Array.isArray(o.buckets) ||
      o.buckets[0] !== "test" ||
      !Array.isArray(o.collections) ||
      o.collections[0] !== "test" ||
      o.collections[1] !== "test1.test2"
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine o="c" p="./serviceAccount.json"', async () => {
    const o = cmdParser([
      "firebase-engine",
      'o="c"',
      'p="./serviceAccount.json"',
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "clean" ||
      !Array.isArray(o.services) ||
      o.services.indexOf("auth") === -1 ||
      o.services.indexOf("firestore") === -1 ||
      o.services.indexOf("storage") === -1 ||
      o.path !== "./serviceAccount.json" ||
      o.compress !== true ||
      o.emulators !== false
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine path="./serviceAccount.json"', async () => {
    const o = cmdParser(["firebase-engine", 'path="./serviceAccount.json"']);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "backup" ||
      !Array.isArray(o.services) ||
      o.services.indexOf("auth") === -1 ||
      o.services.indexOf("firestore") === -1 ||
      o.services.indexOf("storage") === -1 ||
      o.path !== "./serviceAccount.json" ||
      o.compress !== true ||
      o.emulators !== false
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine o="restore" path="./serviceAccount.json" bsk="c2pibmtqa2pua25ubg=="', async () => {
    const o = cmdParser([
      "firebase-engine",
      'o="restore"',
      'path="./serviceAccount.json"',
      'bsk="c2pibmtqa2pua25ubg=="',
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "restore" ||
      !Array.isArray(o.services) ||
      o.services.indexOf("auth") === -1 ||
      o.services.indexOf("firestore") === -1 ||
      o.services.indexOf("storage") === -1 ||
      o.path !== "./serviceAccount.json" ||
      o.compress !== true ||
      o.emulators !== false ||
      typeof o.hash_config !== "object" ||
      o.hash_config.base64_signer_key.toString("base64") !==
        "c2pibmtqa2pua25ubg=="
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine o="restore" path="./serviceAccount.json" algorithm="BCRYPT"', async () => {
    const o = cmdParser([
      "firebase-engine",
      'o="restore"',
      'path="./serviceAccount.json"',
      'algorithm="BCRYPT"',
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "restore" ||
      !Array.isArray(o.services) ||
      o.services.indexOf("auth") === -1 ||
      o.services.indexOf("firestore") === -1 ||
      o.services.indexOf("storage") === -1 ||
      o.path !== "./serviceAccount.json" ||
      o.compress !== true ||
      o.emulators !== false ||
      typeof o.hash_config !== "object" ||
      o.hash_config.algorithm !== "BCRYPT"
    )
      throw new Error("error");
    return;
  });
  it('firebase-engine o="restore" path="./serviceAccount.json" bsk="c2pibmtqa2pua25ubg==" bss="ZHNmZHNkc2Zkc2ZzZHNmc2Q=" alg="SCRYPT" rnd=9 mc=13', async () => {
    const o = cmdParser([
      "firebase-engine",
      'o="restore"',
      'path="./serviceAccount.json"',
      'bsk="c2pibmtqa2pua25ubg=="',
      'bss="ZHNmZHNkc2Zkc2ZzZHNmc2Q="',
      'alg="SCRYPT"',
      "rnd=9",
      "mc=13",
    ]);
    if (
      typeof o !== "object" ||
      !Array.isArray(o.operations) ||
      o.operations[0] !== "restore" ||
      !Array.isArray(o.services) ||
      o.services.indexOf("auth") === -1 ||
      o.services.indexOf("firestore") === -1 ||
      o.services.indexOf("storage") === -1 ||
      o.path !== "./serviceAccount.json" ||
      o.compress !== true ||
      o.emulators !== false ||
      typeof o.hash_config !== "object" ||
      o.hash_config.algorithm !== "SCRYPT" ||
      o.hash_config.base64_signer_key.toString("base64") !==
        "c2pibmtqa2pua25ubg==" ||
      o.hash_config.base64_salt_separator.toString("base64") !==
        "ZHNmZHNkc2Zkc2ZzZHNmc2Q=" ||
      o.hash_config.rounds !== 9 ||
      o.hash_config.mem_cost !== 13
    )
      throw new Error("error");
    return;
  });
});
