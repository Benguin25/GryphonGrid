/**
 * Firestore helpers for GryphonGrid.
 *
 * Data model
 * ──────────
 * Collection : users
 *   Document  : {uid}
 *     Fields  : all Profile fields  +  onboarded: boolean
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Profile } from "./types";

// ── Profile ───────────────────────────────────────────────────────────────────

/** Persist the user's profile to Firestore (merges so other fields are kept). */
export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}

/**
 * Load the user's profile from Firestore.
 * Returns null if the document doesn't exist or has no firstName yet.
 */
export async function loadProfile(uid: string): Promise<Profile | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.firstName) return null;
  return data as Profile;
}

// ── Onboarding flag ───────────────────────────────────────────────────────────

/** Write onboarded: true into the user's document. */
export async function saveOnboarded(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { onboarded: true }, { merge: true });
}

/** Returns true if the user has previously completed onboarding. */
export async function loadOnboarded(uid: string): Promise<boolean> {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return snap.data()?.onboarded === true;
}
