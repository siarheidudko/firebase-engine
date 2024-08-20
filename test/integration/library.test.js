"use strict";
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const admin = require("firebase-admin");
const path = require("path");
const crypto = require("crypto");
const settings = require("../utils/settings");
const fsPromises = require("fs").promises;
Object.assign(global, require("../utils/global"));
const serviceAccount = require(settings.serviceAccountPath);
const FirebaseEngine = require("../../lib/index");

let app;
if (admin.apps.length > 0) {
  app = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
    },
    "library-test"
  );
} else {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const Firestore = app.firestore();
const Auth = app.auth();
const Storage = app.storage();
const Bucket = Storage.bucket(serviceAccount.project_id + ".appspot.com");

describe("Integration test Library", function () {
  const backupPath =
    "./" + crypto.randomFillSync(Buffer.alloc(4)).toString("hex") + ".backup";
  let newDoc;
  const docData = {
    array: admin.firestore.FieldValue.arrayUnion("a", "b"),
    map: {
      number: 1,
      string: "test",
      null: null,
      boolean: true,
      timestamp: admin.firestore.Timestamp.fromMillis(Date.now()),
      ref: Firestore.collection("test").doc(),
      geopoint: new admin.firestore.GeoPoint(1, 11),
      binary: Buffer.from("Test data"),
    },
  };
  const userData = {
    uid: "yZq3YOEDr7cXKtjnUjDpSJpwMBp1",
    email: "sdudko@remedypointsolutions.com",
    emailVerified: false,
    displayName: undefined,
    photoURL: undefined,
    phoneNumber: undefined,
    disabled: false,
    metadata: {
      lastSignInTime: null,
      creationTime: "Thu, 28 May 2020 17:08:39 GMT",
    },
    passwordHash: undefined,
    passwordSalt: undefined,
    customClaims: {
      isTest: true,
    },
    tenantId: undefined,
    providerData: [
      {
        uid: "sdudko@remedypointsolutions.com",
        displayName: undefined,
        email: "sdudko@remedypointsolutions.com",
        photoURL: undefined,
        providerId: "password",
        phoneNumber: undefined,
      },
    ],
  };
  const file = {
    name: "test.txt",
    data: Buffer.from("Test data"),
  };
  before(async () => {
    newDoc = Firestore.collection("test").doc();
    await newDoc.set(docData);
    await Auth.importUsers([userData]);
    const f = Bucket.file(file.name);
    await f.save(file.data);
    return;
  });
  after(async () => {
    await newDoc.delete().catch((err) => {});
    await Auth.deleteUser(userData.uid).catch((err) => {});
    const f = Bucket.file(file.name);
    await f.delete().catch((err) => {});
    await fsPromises.unlink(backupPath).catch((err) => {});
  });
  /*
        Firebase.Auth: Backup, Clean, Restore
    */
  it("Backup, Clean, Restore - Auth", async function () {
    const firebaseEngine = new FirebaseEngine({
      path: settings.serviceAccountPath,
      backup: backupPath,
      compress: false,
      buckets: [],
      collections: [],
    });
    await fsPromises.unlink(backupPath).catch((err) => {});
    //backup
    await firebaseEngine.jobs.backup.auth();
    //exit streams
    await firebaseEngine.exit();
    const files = await fsPromises.readdir("./");
    const errors = [];
    if (files.indexOf(path.basename(backupPath)) === -1)
      errors.push("Backup file not found!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //clean
    await firebaseEngine.jobs.clean.auth();
    const users = await Auth.listUsers();
    if (Array.isArray(users) && users.length !== 0)
      errors.push("Auth is not empty!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //restore
    await firebaseEngine.jobs.restore.auth();
    const _users = await Auth.listUsers();
    if (Array.isArray(_users) && _users.length === 0) {
      errors.push("Auth is empty!");
    } else {
      const _user = await Auth.getUser(userData.uid);
      if (
        userData.uid !== _user.uid ||
        userData.email !== _user.email ||
        userData.displayName !== _user.displayName ||
        userData.photoURL !== _user.phoneNumber ||
        userData.phoneNumber !== _user.phoneNumber ||
        userData.disabled !== _user.disabled ||
        userData.metadata.lastSignInTime !== _user.metadata.lastSignInTime ||
        userData.metadata.creationTime !== _user.metadata.creationTime ||
        userData.passwordHash !== _user.passwordHash ||
        userData.passwordSalt !== _user.passwordSalt ||
        userData.customClaims.isTest !== _user.customClaims.isTest ||
        userData.tenantId !== _user.tenantId //||
        // (userData.providerData[0].uid !== _user.providerData[0].uid) ||
        // (userData.providerData[0].displayName !== _user.providerData[0].displayName) ||
        // (userData.providerData[0].email !== _user.providerData[0].email) ||
        // (userData.providerData[0].photoURL !== _user.providerData[0].photoURL) ||
        // (userData.providerData[0].providerId !== _user.providerData[0].providerId) ||
        // (userData.providerData[0].phoneNumber !== _user.providerData[0].phoneNumber)
      )
        errors.push("User data not equal!");
    }
    if (errors.length > 0) throw new Error(errors.join(", "));
    return;
  });
  /*
        Firebase.Firestore: Backup, Clean, Restore
    */
  it("Backup, Clean, Restore - Firestore", async function () {
    const firebaseEngine = new FirebaseEngine({
      path: settings.serviceAccountPath,
      backup: backupPath,
      compress: false,
      emulators: false,
      buckets: [],
      collections: [],
    });
    await fsPromises.unlink(backupPath).catch((err) => {});
    //backup
    await firebaseEngine.jobs.backup.firestore();
    //exit streams
    await firebaseEngine.exit();
    const files = await fsPromises.readdir("./");
    const errors = [];
    if (files.indexOf(path.basename(backupPath)) === -1)
      errors.push("Backup file not found!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //clean
    await firebaseEngine.jobs.clean.firestore();
    const collections = await Firestore.listCollections();
    if (Array.isArray(collections) && collections.length !== 0)
      errors.push("Firestore is not empty!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //restore
    await firebaseEngine.jobs.restore.firestore();
    const _collections = await Firestore.listCollections();
    breakDoc: if (Array.isArray(_collections) && _collections.length === 0) {
      errors.push("Firestore is empty!");
    } else {
      const _docSnap = await newDoc.get();
      if (!_docSnap.exists) {
        errors.push("Document is not exists!");
        break breakDoc;
      }
      const _docData = _docSnap.data();
      if (!_docData) {
        errors.push("Document is empty!");
        break breakDoc;
      }
      if (
        !Array.isArray(_docData.array) ||
        _docData.array.indexOf("a") === -1 ||
        _docData.array.indexOf("b") === -1 ||
        _docData.array.length !== 2 ||
        _docData.map.number !== docData.map.number ||
        _docData.map.string !== docData.map.string ||
        _docData.map.null !== docData.map.null ||
        _docData.map.boolean !== docData.map.boolean ||
        _docData.map.timestamp.toMillis() !==
          docData.map.timestamp.toMillis() ||
        _docData.map.ref.id !== docData.map.ref.id ||
        _docData.map.geopoint.latitude !== docData.map.geopoint.latitude ||
        _docData.map.geopoint.longitude !== docData.map.geopoint.longitude ||
        !(_docData.map.binary instanceof Buffer) ||
        docData.map.binary.equals(_docData.map.binary) !== true
      )
        errors.push("User data not equal!");
    }
    if (errors.length > 0) throw new Error(errors.join(", "));
    return;
  });
  /*
        Firebase.Storage: Backup, Clean, Restore
    */
  it("Backup, Clean, Restore - Storage", async function () {
    const firebaseEngine = new FirebaseEngine({
      path: settings.serviceAccountPath,
      backup: backupPath,
      compress: false,
      buckets: [],
      collections: [],
    });
    await fsPromises.unlink(backupPath).catch((err) => {});
    //backup
    await firebaseEngine.jobs.backup.storage();
    //exit streams
    await firebaseEngine.exit();
    const files = await fsPromises.readdir("./");
    const errors = [];
    if (files.indexOf(path.basename(backupPath)) === -1)
      errors.push("Backup file not found!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //clean
    await firebaseEngine.jobs.clean.storage();
    const [files1] = await Bucket.getFiles();
    if (Array.isArray(files1) && files1.length !== 0)
      errors.push("Storage is not empty!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //restore
    await firebaseEngine.jobs.restore.storage();
    const [files2] = await Bucket.getFiles();
    if (Array.isArray(files2) && files2.length === 0) {
      errors.push("Storage is empty!");
    } else {
      const _file = Bucket.file(file.name);
      const [buffer] = await _file.download();
      if (_file.name !== file.name) errors.push("File path not equal!");
      if (file.data.equals(buffer) !== true)
        errors.push("File data not equal!");
    }
    if (errors.length > 0) throw new Error(errors.join(", "));
    return;
  });
  /*
        Firebase.Auth, Firebase.Firestore, Firebase.Storage: Backup, Clean, Restore
    */
  it("Backup, Clean, Restore - Auth, Firestore, Storage", async function () {
    const firebaseEngine = new FirebaseEngine({
      path: "./serviceAccount.json",
      backup: backupPath,
      compress: true,
      buckets: [serviceAccount.project_id + ".appspot.com"],
      collections: ["test"],
    });
    await fsPromises.unlink(backupPath).catch((err) => {});
    //backup
    await firebaseEngine.jobs.backup.auth();
    await firebaseEngine.jobs.backup.firestore();
    await firebaseEngine.jobs.backup.storage();
    //exit streams
    await firebaseEngine.exit();
    const files = await fsPromises.readdir("./");
    const errors = [];
    if (files.indexOf(path.basename(backupPath)) === -1)
      errors.push("Backup file not found!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //clean
    await firebaseEngine.jobs.clean.auth();
    const users = await Auth.listUsers();
    if (Array.isArray(users) && users.length !== 0)
      errors.push("Auth is not empty!");
    await firebaseEngine.jobs.clean.firestore();
    const collections = await Firestore.listCollections();
    if (Array.isArray(collections) && collections.length !== 0)
      errors.push("Firestore is not empty!");
    await firebaseEngine.jobs.clean.storage();
    const [files1] = await Bucket.getFiles();
    if (Array.isArray(files1) && files1.length !== 0)
      errors.push("Storage is not empty!");
    if (errors.length > 0) throw new Error(errors.join(", "));
    //restore
    await firebaseEngine.jobs.restore.auth();
    const _users = await Auth.listUsers();
    if (Array.isArray(_users) && _users.length === 0) {
      errors.push("Auth is empty!");
    } else {
      const _user = await Auth.getUser(userData.uid);
      if (
        userData.uid !== _user.uid ||
        userData.email !== _user.email ||
        userData.displayName !== _user.displayName ||
        userData.photoURL !== _user.phoneNumber ||
        userData.phoneNumber !== _user.phoneNumber ||
        userData.disabled !== _user.disabled ||
        userData.metadata.lastSignInTime !== _user.metadata.lastSignInTime ||
        userData.metadata.creationTime !== _user.metadata.creationTime ||
        userData.passwordHash !== _user.passwordHash ||
        userData.passwordSalt !== _user.passwordSalt ||
        userData.customClaims.isTest !== _user.customClaims.isTest ||
        userData.tenantId !== _user.tenantId //||
        // (userData.providerData[0].uid !== _user.providerData[0].uid) ||
        // (userData.providerData[0].displayName !== _user.providerData[0].displayName) ||
        // (userData.providerData[0].email !== _user.providerData[0].email) ||
        // (userData.providerData[0].photoURL !== _user.providerData[0].photoURL) ||
        // (userData.providerData[0].providerId !== _user.providerData[0].providerId) ||
        // (userData.providerData[0].phoneNumber !== _user.providerData[0].phoneNumber)
      )
        errors.push("User data not equal!");
    }
    await firebaseEngine.jobs.restore.firestore();
    const _collections = await Firestore.listCollections();
    breakDoc: if (Array.isArray(_collections) && _collections.length === 0) {
      errors.push("Firestore is empty!");
    } else {
      const _docSnap = await newDoc.get();
      if (!_docSnap.exists) {
        errors.push("Document is not exists!");
        break breakDoc;
      }
      const _docData = _docSnap.data();
      if (!_docData) {
        errors.push("Document is empty!");
        break breakDoc;
      }
      if (
        !Array.isArray(_docData.array) ||
        _docData.array.indexOf("a") === -1 ||
        _docData.array.indexOf("b") === -1 ||
        _docData.array.length !== 2 ||
        _docData.map.number !== docData.map.number ||
        _docData.map.string !== docData.map.string ||
        _docData.map.null !== docData.map.null ||
        _docData.map.boolean !== docData.map.boolean ||
        _docData.map.timestamp.toMillis() !==
          docData.map.timestamp.toMillis() ||
        _docData.map.ref.id !== docData.map.ref.id ||
        _docData.map.geopoint.latitude !== docData.map.geopoint.latitude ||
        _docData.map.geopoint.longitude !== docData.map.geopoint.longitude ||
        !(_docData.map.binary instanceof Buffer) ||
        docData.map.binary.equals(_docData.map.binary) !== true
      )
        errors.push("User data not equal!");
    }
    await firebaseEngine.jobs.restore.storage();
    const [files2] = await Bucket.getFiles();
    if (Array.isArray(files2) && files2.length === 0) {
      errors.push("Storage is empty!");
    } else {
      const _file = Bucket.file(file.name);
      const [buffer] = await _file.download();
      if (_file.name !== file.name) errors.push("File path not equal!");
      if (file.data.equals(buffer) !== true)
        errors.push("File data not equal!");
    }
    if (errors.length > 0) throw new Error(errors.join(", "));
    return;
  });
});
