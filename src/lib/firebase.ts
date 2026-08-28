// ─────────────────────────────────────────────────────────────────────────────
// Firebase configuration for Our Lobby
// ─────────────────────────────────────────────────────────────────────────────
// To enable real-time sync:
//   1. Create a project at https://console.firebase.google.com
//   2. Copy your firebaseConfig values into .env.local:
//      VITE_FIREBASE_API_KEY=...
//      VITE_FIREBASE_AUTH_DOMAIN=...
//      VITE_FIREBASE_PROJECT_ID=...
//      VITE_FIREBASE_STORAGE_BUCKET=...
//      VITE_FIREBASE_MESSAGING_SENDER_ID=...
//      VITE_FIREBASE_APP_ID=...
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is fully configured
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('[Firebase] ✅ Connected — real-time sync active');
  } catch (err) {
    console.warn('[Firebase] ⚠️ Failed to initialize:', err);
  }
} else {
  console.info('[Firebase] ℹ️ No config found — running in local mode (localStorage only)');
}

export { db, storage, app };
export {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
};
