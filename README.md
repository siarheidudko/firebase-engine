
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

## Docs

[See docs](https://siarheidudko.github.io/firebase-engine)

## Use
    
```
	firebase-engine operations="clean, restore", path="./test.json" services="firestore, storage" backup="test.backup"
```

```
	firebase-engine o="b, c", p="./test.json" b="test.backup"
```
  
## LICENSE  
  
MIT  