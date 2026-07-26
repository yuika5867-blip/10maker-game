// Firebase Web SDK Configuration & Module Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace with your actual Firebase Project config if available
// Vercel deployment allows setting these via environment variables or direct replacement
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey_ReplaceWithYourFirebaseApiKey",
  authDomain: "make10-masters.firebaseapp.com",
  projectId: "make10-masters",
  storageBucket: "make10-masters.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demoappid123456"
};

let app, auth, db, googleProvider;
let isFirebaseAvailable = false;

try {
  // Only initialize if not placeholder key, or attempt initialization gracefully
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("DemoKey")) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseAvailable = true;
    console.log("🔥 Firebase initialized successfully.");
  } else {
    console.warn("⚠️ Firebase Demo Config detected. App will run in hybrid/offline mode until your actual Firebase credentials are set in firebase-config.js!");
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

export { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  isFirebaseAvailable
};
