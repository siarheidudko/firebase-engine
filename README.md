
# firebase-engine
Engine to Backup, Clean, Restore. Work for Firebase.Firestore, Firebase.Storage, Firebase.Auth 

[![npm](https://img.shields.io/npm/v/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
[![npm](https://img.shields.io/npm/dy/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
[![NpmLicense](https://img.shields.io/npm/l/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
![GitHub last commit](https://img.shields.io/github/last-commit/siarheidudko/firebase-engine.svg)
![GitHub release](https://img.shields.io/github/release/siarheidudko/firebase-engine.svg)
  
## Install  
  
```
	npm i firebase-engine -g
```

## Launch parameters

|     Name     | Short name |                                   Description                                    |
|--------------|------------|----------------------------------------------------------------------------------|
|  operations  |     o      |              backup (b), restore (r) or clean (c). Default: backup               |
|     path     |     p      |                        Path to service account JSON file                         |
|   services   |     s      |  firestore (f), storage (s), auth (a), can be separated by commas. Default: all  |
|    backup    |     b      |   Path to backup or restore file. Default: ./{$PROJECT_ID + $TIMESTAMP}.backup   |
| --nocompress |    -nc     |                          Do not use data compression                             |

## Use

With full names
```bash
	firebase-engine operations="clean, restore" path="./test.json" services="firestore, storage" backup="test.backup"
```

With short names
```bash
	firebase-engine o="b, c" p="./test.json" b="test.backup"
```

## Open Source

[See source docs](https://siarheidudko.github.io/firebase-engine)

[See source](https://github.com/siarheidudko/firebase-engine)

## Service Account Key

Get your service account key from IAM
[Open google IAM](https://console.cloud.google.com/iam-admin/serviceaccounts)

Or from the FIREBASE project
[Open official firebase docs](https://sites.google.com/site/scriptsexamples/new-connectors-to-google-services/firebase/tutorials/authenticate-with-a-service-account)

### WARNING (Password hashes of users)

This API also returns the passwordSalt and passwordHash hashed by the Firebase Auth backend for password users if the user/service account used to generate the request OAuth access token has the firebaseauth.configs.getHashConfig permission. Otherwise the passwordHash and passwordSalt will not be set.
[Open official firebase docs](https://firebase.google.com/docs/auth/admin/manage-users#password_hashes_of_listed_users)

### NOTE
The library is currently not stable. There are a number of problems interacting with firebase, validation on big data is often unsuccessful. The stable version will be released under release 1.0.0.
  
## LICENSE  
  
Apache-2.0  