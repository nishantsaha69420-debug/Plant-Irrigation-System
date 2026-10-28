import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForRootwise",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "auto-irrigation-system-8225b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "auto-irrigation-system-8225b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "auto-irrigation-system-8225b.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "109283746501",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:109283746501:web:987654321fedcba",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

let app: FirebaseApp | undefined;
let db: Database | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(customUrl?: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const url = customUrl || DEFAULT_FIREBASE_CONFIG.databaseURL;

  if (!getApps().length) {
    app = initializeApp({
      ...DEFAULT_FIREBASE_CONFIG,
      databaseURL: url
    });
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

export function getFirebaseAuth(): Auth | null {
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  if (!auth) {
    auth = getAuth(currentApp);
  }
  return auth;
}

