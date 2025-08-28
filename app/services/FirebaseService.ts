import { initializeApp, FirebaseApp } from "firebase/app";
import { Auth, initializeAuth, inMemoryPersistence, getReactNativePersistence, } from "firebase/auth";
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase Config
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Initialise Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialise Firebase Auth
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});


// Initialise Firestore
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),

});

console.log("Firebase Initialized");
console.log("Connected to Firestore");

// Export individual services
export { app, auth, db };

