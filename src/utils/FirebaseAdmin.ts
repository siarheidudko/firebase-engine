import { App, initializeApp, cert, getApps } from "firebase-admin/app";

const credential = { cert };
const apps = { get length() { return getApps().length; } };

export { initializeApp, App, credential, apps };
