// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- STEP 1: PASTE YOUR KEYS CAREFULLY BETWEEN THE QUOTES BELOW ---
const API_KEY = "AIzaSyBUs2xAQlMNimPs4PJ0mnLFc8fXQQfiksU";
const AUTH_DOMAIN = "kintsugi-wellness-app.firebaseapp.com";
const PROJECT_ID = "kintsugi-wellness-app";
const STORAGE_BUCKET = "kintsugi-wellness-app.firebasestorage.app";
const MESSAGING_SENDER_ID = "771278444303";
const APP_ID = "1:771278444303:web:2b1e81c8e4fcf8c391907a";
// -------------------------------------------------------------------

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
};

// Initialize Firebase
let app;
let db;

// Check if a Firebase app is already initialized
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase Initialized Successfully!");
  } catch (error) {
    console.error("❌ FIREBASE INITIALIZATION ERROR:", error);
  }
} else {
  // If it's already initialized, use the existing app
  app = getApp();
  console.log("✅ Firebase was already initialized.");
}

db = getFirestore(app);

export { db };