import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

export const DEFAULT_FIREBASE_CONFIG = {
  databaseURL: "https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

let app: FirebaseApp | undefined;
let db: Database | undefined;

export function getFirebaseApp(customUrl?: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const url = customUrl || DEFAULT_FIREBASE_CONFIG.databaseURL;

  if (!getApps().length) {
    app = initializeApp({ databaseURL: url });
  } else {
    app = getApp();
  }
  return app;
}

export function getFirebaseDb(customUrl?: string): Database | null {
  const currentApp = getFirebaseApp(customUrl);
  if (!currentApp) return null;
  
  if (!db) {
    db = getDatabase(currentApp, customUrl || DEFAULT_FIREBASE_CONFIG.databaseURL);
  }
  return db;
}
