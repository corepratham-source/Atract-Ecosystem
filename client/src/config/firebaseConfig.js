// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
// };

// // Check if Firebase config is properly loaded
// const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// let appInstance = null;
// let authInstance = null;
// let dbInstance = null;

// if (isConfigured) {
//   try {
//     appInstance = initializeApp(firebaseConfig);
//     authInstance = getAuth(appInstance);
//     dbInstance = getFirestore(appInstance);
//     console.log("[Firebase] Initialized successfully");
//   } catch (error) {
//     console.error("[Firebase] Initialization error:", error);
//   }
// } else {
//   console.warn("[Firebase] Not configured - missing environment variables");
// }

// // Export as named exports
// export const firebaseApp = appInstance;
// export const firebaseAuth = authInstance;
// export const firebaseDb = dbInstance;
// export const firebaseIsConfigured = isConfigured;

// // Also export for backward compatibility
// export const auth = authInstance;
// export const db = dbInstance;
// export const isFirebaseConfigured = isConfigured;
// export default appInstance;


// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Use let because we might downgrade it later if init fails
let isConfigured =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.authDomain);

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Initialized successfully");
  } catch (err) {
    console.error("[Firebase] Initialization failed:", err);
    isConfigured = false;           // ← now allowed because it's let
  }
} else {
  console.warn("[Firebase] Firebase config incomplete → running without Firebase");
}

export {
  app as firebaseApp,
  auth as firebaseAuth,
  db as firebaseDb,
  isConfigured as isFirebaseConfigured,
};

// Compatibility / legacy exports
export const firebase = app;
export { auth, db, isConfigured };