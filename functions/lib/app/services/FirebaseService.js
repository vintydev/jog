"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = exports.app = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const _env_1 = require("@env");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
// Firebase Config
const firebaseConfig = {
    apiKey: _env_1.FIREBASE_API_KEY,
    authDomain: _env_1.FIREBASE_AUTH_DOMAIN,
    projectId: _env_1.FIREBASE_PROJECT_ID,
    storageBucket: _env_1.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: _env_1.FIREBASE_MESSAGING_SENDER_ID,
    appId: _env_1.FIREBASE_APP_ID,
    measurementId: _env_1.FIREBASE_MEASUREMENT_ID
};
// Initialise Firebase App
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.app = app;
// Initialise Firebase Auth
const auth = (0, auth_1.initializeAuth)(app, {
    persistence: (0, auth_1.getReactNativePersistence)(async_storage_1.default),
});
exports.auth = auth;
// Initialise Firestore
const db = (0, firestore_1.initializeFirestore)(app, {
    localCache: (0, firestore_1.persistentLocalCache)(),
});
exports.db = db;
console.log("Firebase Initialized");
console.log("Connected to Firestore");
