/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Firebase configuration for GryphonGrid
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  SETUP STEPS:
 *  1. Go to https://console.firebase.google.com/ and create a project (or open
 *     an existing one).
 *  2. Add a Web app to the project and copy the firebaseConfig object below.
 *  3. In the Firebase console: Authentication → Sign-in method → enable
 *       • Email/Password
 *       • Google  (add your SHA-1 fingerprint for Android under Project Settings
 *                  → Your apps → Android app)
 *  4. For Google Sign-In you also need OAuth 2.0 client IDs from
 *     https://console.cloud.google.com/apis/credentials
 *     Paste them into the GOOGLE_IOS / ANDROID / WEB_CLIENT_ID constants below.
 *
 *  TIP: Put real values in a .env file and import them with expo-constants or
 *       react-native-dotenv to keep credentials out of source control.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Replace these with your project's values ─────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAUoZgfLz6DSwTPbICfWBRsN4PEF-l8puE",
  authDomain: "gryphongrid-13257.firebaseapp.com",
  projectId: "gryphongrid-13257",
  storageBucket: "gryphongrid-13257.firebasestorage.app",
  messagingSenderId: "267823198171",
  appId: "1:267823198171:web:8a2e01a3da13f0773cc1fe",
  measurementId: "G-LW44KZSVDN"
};

// Google OAuth client IDs (from Google Cloud Console → Credentials)
// Needed for Google Sign-In only – leave as empty string to hide the button
export const GOOGLE_IOS_CLIENT_ID     = "";   // e.g. "xxxxx.apps.googleusercontent.com"
export const GOOGLE_ANDROID_CLIENT_ID = "";
export const GOOGLE_WEB_CLIENT_ID     = "";   // always required for Firebase credential

// ── Firebase init (guard against hot-reload double-init) ─────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Custom AsyncStorage persistence so users stay logged-in across app restarts.
 * Firebase v10+ removed getReactNativePersistence; this is the manual equivalent.
 */
const asyncStoragePersistence = {
  type: "LOCAL" as const,
  async _isAvailable() {
    try {
      await AsyncStorage.setItem("__firebase_test__", "1");
      await AsyncStorage.removeItem("__firebase_test__");
      return true;
    } catch {
      return false;
    }
  },
  async _set(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async _get(key: string) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  async _remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  _addListener(_key: string, _listener: unknown) {},
  _removeListener(_key: string, _listener: unknown) {},
};

// initializeAuth throws if called again during hot reload; fall back to getAuth
let firebaseAuth: ReturnType<typeof getAuth>;
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firebaseAuth = initializeAuth(app, { persistence: asyncStoragePersistence as any });
} catch {
  firebaseAuth = getAuth(app);
}

export { firebaseAuth };
