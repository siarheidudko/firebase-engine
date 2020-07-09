# firebase-engine
Engine to Backup, Clean, Restore. Work for Firebase.Firestore, Firebase.Storage, Firebase.Auth 

[![npm](https://img.shields.io/npm/v/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
[![npm](https://img.shields.io/npm/dy/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
[![NpmLicense](https://img.shields.io/npm/l/firebase-engine.svg)](https://www.npmjs.com/package/firebase-engine)
![GitHub last commit](https://img.shields.io/github/last-commit/siarheidudko/firebase-engine.svg)
![GitHub release](https://img.shields.io/github/release/siarheidudko/firebase-engine.svg)
  
## Install  
  
```bash
	npm i firebase-engine -g
```

## Launch parameters

|     Name     | Short name |                                   Description                                    |
|--------------|------------|----------------------------------------------------------------------------------|
|  operations  |     o      |              backup (b), restore (r) or clean (c). Default: backup               |
|     path     |     p      |                        Path to service account JSON file                         |
|   services   |     s      |  firestore (f), storage (s), auth (a), can be separated by commas. Default: all  |
|    backup    |     b      |   Path to backup or restore file. Default: ./{$PROJECT_ID + $TIMESTAMP}.backup   |
|  collections |   coll     |    Apply to Collections (in Firestore service). Default: all, if it is not set   |
|    buckets   |   buck     |       Apply to Buckets (in Storage service). Default: all, if it is not set      |
| --nocompress |    -nc     |                          Do not use data compression                             |
|  --emulators |    -em     |                  Use firebase emulators (work for firestore)                     |

- collections - the rule also applies to all nested collections and documents

## Launch parameters (only for password recovery for users in Firebase.Auth)

|     Name              | Short name |                                   Description                                    |
|-----------------------|------------|----------------------------------------------------------------------------------|
|       algorithm       |    alg     | The password hashing information (algorithm, only SCRYPT). Default: SCRYPT       |
|   base64_signer_key   |    bsk     | The password hashing information (key in base64 encoding). Default: user passwords are not restored if not set. |
| base64_salt_separator |    bss     | The password hashing information (salt separator in base64). Default: Bw==       |
|        rounds         |    rnd     | The password hashing information (rounds). Default: 8                            |
|       mem_cost        |     mc     | The password hashing information (memory cost). Default: 14                      |


## Use

With full names
```bash
	firebase-engine operations="clean, restore" path="./test.json" services="firestore, storage" backup="test.backup"
```

With one bucket
```bash
	firebase-engine operations="clean" path="./test.json" services="storage" buckets="test.appspott.com"
```

With collection & subcollection
```bash
	firebase-engine operations="backup" path="./test.json" services="firestore" collections="authors,books.pages"
```

With short names
```bash
	firebase-engine o="b, c" p="./test.json" b="test.backup"
```

With password recovery for users
```bash
	firebase-engine operations="restore" path="./test.json" services="firestore, auth" backup="test.backup" bsk="nMyNs6sFWp0GZ/JSW2tsNGvGZ70oiv13gxO7ub7rxPwK271P945BiZmjrdsBRbgZmzPPgwATLR6FaXq3rUspVg=="
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

Firebase API also returns the passwordSalt and passwordHash hashed by the Firebase Auth backend for password users if the user/service account used to generate the request OAuth access token has the firebaseauth.configs.getHashConfig permission. Otherwise the passwordHash and passwordSalt will not be set.
[Open official firebase docs](https://firebase.google.com/docs/auth/admin/manage-users#password_hashes_of_listed_users)

### WARNING (restoration of subcollections)
I recommend using only the top collection level in the collections parameter. Because you can get shadow document by restoring a subcollection in a non-existent document.
To a full database cleanup, including shadow documents, use the command in firebase tools
```bash
	firebase firestore:delete -r
```
  
## LICENSE  
  
Apache-2.0  