import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { firebaseAuth, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../lib/firebase";

// Required for OAuth redirect handling in Expo
WebBrowser.maybeCompleteAuthSession();

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => void;
  googleLoading: boolean;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: () => {},
  googleLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth request — always pass a config object (hook can't receive null).
  // When GOOGLE_WEB_CLIENT_ID isn't set, a placeholder keeps the hook happy;
  // signInWithGoogle() guards against ever calling promptGoogleAsync() in that case.
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || "__not_configured__",
    scopes: ["profile", "email", "openid"],
  });

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken =
        // expo-auth-session v4+ puts it here:
        (googleResponse as any).authentication?.idToken ??
        // fallback: raw params from the OAuth redirect
        googleResponse.params?.id_token;

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        setGoogleLoading(true);
        signInWithCredential(firebaseAuth, credential)
          .catch(console.error)
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [googleResponse]);

  // ── Auth actions ────────────────────────────────────────────────────────────

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const { user: newUser } = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    if (displayName) {
      await updateProfile(newUser, { displayName });
    }
  }

  async function signOut() {
    await firebaseSignOut(firebaseAuth);
  }

  function signInWithGoogle() {
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.warn(
        "Google Sign-In requires GOOGLE_WEB_CLIENT_ID to be set in lib/firebase.ts"
      );
      return;
    }
    promptGoogleAsync();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, googleLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
