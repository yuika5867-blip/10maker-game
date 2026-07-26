// Firebase Web SDK Configuration & Security Loader
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

// Safe Environment Config Resolution
const env = window.__ENV__ || {};

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY || "AIzaSyDemoKey_ReplaceWithYourFirebaseApiKey",
  authDomain: env.FIREBASE_AUTH_DOMAIN || "make10-masters.firebaseapp.com",
  projectId: env.FIREBASE_PROJECT_ID || "make10-masters",
  storageBucket: env.FIREBASE_STORAGE_BUCKET || "make10-masters.appspot.com",
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.FIREBASE_APP_ID || "1:123456789012:web:demoappid123456"
};

let app, auth, db, googleProvider;
let isFirebaseAvailable = false;

try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("DemoKey")) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseAvailable = true;
    console.log("🔥 Firebase 보안 연동 완료.");
  } else {
    console.warn("⚠️ Firebase 환경변수가 연결 대기 중입니다. 키가 입력되면 안전하게 연동됩니다.");
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
