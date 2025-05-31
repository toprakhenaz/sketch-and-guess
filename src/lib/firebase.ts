
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Gelecekte kimlik doğrulama için

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // İsteğe bağlı
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


// Firebase uygulamasını başlat
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: any) {
    console.error("CRITICAL_ERROR: Firebase initialization failed.", error.message || error);
    // If initialization fails, app and db will be undefined, leading to errors downstream.
    // This log helps identify the root cause.
    throw error; // Re-throw to ensure failure is propagated
  }
} else {
  app = getApp();
}

const db = getFirestore(app);
// const auth = getAuth(app); // Gelecekte kimlik doğrulama için

export { app, db /*, auth */ };
