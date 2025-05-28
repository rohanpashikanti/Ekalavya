// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0xrmK-FUohZmRxgPTsiepbzXS6xR5kvc",
  authDomain: "apti-4bc8e.firebaseapp.com",
  projectId: "apti-4bc8e",
  storageBucket: "apti-4bc8e.firebasestorage.app",
  messagingSenderId: "948345161914",
  appId: "1:948345161914:web:efa000044f825d8ce3da83",
  measurementId: "G-HPFEFN8L5M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db }; 