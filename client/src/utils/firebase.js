
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "aira-55e88.firebaseapp.com",
  projectId: "aira-55e88",
  storageBucket: "aira-55e88.firebasestorage.app",
  messagingSenderId: "888309703097",
  appId: "1:888309703097:web:90e5943be7ab270a3f5668",
  measurementId: "G-HD565XMMS8"
};

const app = initializeApp(firebaseConfig);

// Analytics may fail in some environments (e.g., localhost, adblockers)
try { getAnalytics(app); } catch(e) { /* non-critical */ }

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export{auth, provider}