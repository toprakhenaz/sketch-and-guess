import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Gelecekte kimlik doğrulama için

const firebaseConfig = {
  apiKey: "AIzaSyCYDsdriMuRQP-y6fMqOruE25V5SpbD4fg",
  authDomain: "artful-guesser.firebaseapp.com",
  databaseURL: "https://artful-guesser-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "artful-guesser",
  storageBucket: "artful-guesser.firebasestorage.app",
  messagingSenderId: "154862045414",
  appId: "1:154862045414:web:d8a124cc520f735b461327",
  measurementId: "G-Z3848WXTWJ"
};

// Check for essential Firebase config keys
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMessage = `CRITICAL_ERROR: Firebase apiKey or projectId is missing from environment variables.
    Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your .env.local file or deployment environment.
    apiKey: ${firebaseConfig.apiKey ? '****** (set)' : 'MISSING'}
    projectId: ${firebaseConfig.projectId || 'MISSING'}
  `;
  console.error(errorMessage);
  // Throwing an error here will stop further execution if Firebase cannot be initialized.
  // This might still lead to a generic error on the client, but the server log will be very clear.
  // Alternatively, you could allow the app to attempt to initialize and let initializeApp throw its own error.
  // For now, this explicit check provides a clearer message earlier.
  if (typeof window === 'undefined') { // Only throw on server-side to avoid breaking client immediately if bundle includes this
     // throw new Error(errorMessage); // Decided to only log to avoid direct throw that Next.js might obscure
  }
}

// Firebase'i sadece bir kez başlat
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
// const auth = getAuth(app); // Gelecekte kimlik doğrulama için

export { db /*, auth */ };
