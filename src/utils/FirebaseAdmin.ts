import { App, initializeApp, cert, getApps } from "firebase-admin/app";

// firebase-admin v14 removed the `credential` namespace and `apps` array.
// Shim both so call-sites don't need to change.
const credential = { cert };
// Proxy forwards every property access to a fresh getApps() call so that
// `apps.length` always reflects the live set of initialized apps.
const apps = new Proxy([] as App[], {
  get(_target, prop) {
    return Reflect.get(getApps(), prop);
  },
});

export { initializeApp, App, credential, apps };
