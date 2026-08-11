import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Project ai-riser-namdosan configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForAIRiserNamDoSan2026",
  authDomain: "ai-riser-namdosan.firebaseapp.com",
  projectId: "ai-riser-namdosan",
  storageBucket: "ai-riser-namdosan.appspot.com",
  messagingSenderId: "549420265836",
  appId: "1:549420265836:web:8a92b3c4d5e6f7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
