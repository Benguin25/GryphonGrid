import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
