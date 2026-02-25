/**
 * Firestore helpers for GryphonGrid.
 *
 * Data model
 * ──────────
 * Collection : users
 *   Document  : {uid}
 *     Fields  : all Profile fields  +  onboarded: boolean
 *
 * Collection : requests
 *   Document  : {fromUid}_{toUid}
 *     Fields  : id, fromUid, toUid, fromName, fromPhoto, status, createdAt
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, where, onSnapshot,
} from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "./firebase";
import { Profile, RoommateRequest } from "./types";

const CLOUDINARY_CLOUD = "docmtzxiv";
const CLOUDINARY_PRESET = "gryphongrid_profiles";

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Upload a profile photo (local file URI or blob URL) to Cloudinary
 * and return a persistent public download URL.
 */
export async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web, localUri is a blob URL — fetch it into a real Blob first
    const res = await fetch(localUri);
    const blob = await res.blob();
    formData.append("file", blob, `profile_${uid}.jpg`);
  } else {
    // On native, React Native FormData accepts { uri, type, name }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append("file", { uri: localUri, type: "image/jpeg", name: `profile_${uid}.jpg` } as any);
  }

  formData.append("upload_preset", CLOUDINARY_PRESET);
  // Note: public_id is intentionally omitted — unsigned presets reject custom
  // public IDs by default. Each upload gets a unique Cloudinary-generated ID;
  // the new URL is saved into Firestore so the old asset is simply abandoned.

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message ?? "Cloudinary upload failed";
    console.error("[uploadProfilePhoto] Cloudinary error:", data);
    throw new Error(msg);
  }
  console.log("[uploadProfilePhoto] success:", data.secure_url);
  return data.secure_url as string;
}

/** Persist the user's profile to Firestore (merges so other fields are kept). */
export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  console.log("[db] saveProfile → uid:", uid, "projectId:", (db as any)._databaseId?.projectId);
  await setDoc(doc(db, "users", uid), profile, { merge: true });
  console.log("[db] saveProfile ✓ done");
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

/** Load all complete profiles except the current user's. */
export async function loadAllProfiles(excludeUid: string): Promise<Profile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => d.data() as Profile)
    .filter((p) => p.firstName && p.id && p.id !== excludeUid);
}

// ── Onboarding flag ───────────────────────────────────────────────────────────

/** Write onboarded: true into the user's document. */
export async function saveOnboarded(uid: string): Promise<void> {
  console.log("[db] saveOnboarded → uid:", uid);
  await setDoc(doc(db, "users", uid), { onboarded: true }, { merge: true });
  console.log("[db] saveOnboarded ✓ done");
}

/** Returns true if the user has previously completed onboarding. */
export async function loadOnboarded(uid: string): Promise<boolean> {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return snap.data()?.onboarded === true;
}

// ── Roommate requests ─────────────────────────────────────────────────────────

/** Send a roommate request. Doc ID is deterministic: {fromUid}_{toUid}. */
export async function sendRoommateRequest(
  fromUid: string,
  senderProfile: Profile,  // the sender's own profile (for the name/photo snapshot in the request)
  toUid: string,
): Promise<void> {
  const reqId = `${fromUid}_${toUid}`;
  // Re-read the sender's own profile for the snapshot
  const senderSnap = await getDoc(doc(db, "users", fromUid));
  const sender = senderSnap.exists() ? (senderSnap.data() as Profile) : senderProfile;
  const req: RoommateRequest = {
    id: reqId,
    fromUid,
    toUid,
    fromName:  sender.firstName ?? "Someone",
    fromPhoto: sender.photoUrl  ?? "",
    status:    "pending",
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "requests", reqId), req);
}

/** Accept or decline an incoming request. */
export async function respondToRequest(
  requestId: string,
  status: "accepted" | "declined",
): Promise<void> {
  await updateDoc(doc(db, "requests", requestId), { status });
}

/**
 * Get the request between two users (either direction).
 * Returns null if no request exists.
 */
export async function getRequestBetween(
  uid1: string,
  uid2: string,
): Promise<RoommateRequest | null> {
  const [s1, s2] = await Promise.all([
    getDoc(doc(db, "requests", `${uid1}_${uid2}`)),
    getDoc(doc(db, "requests", `${uid2}_${uid1}`)),
  ]);
  if (s1.exists()) return s1.data() as RoommateRequest;
  if (s2.exists()) return s2.data() as RoommateRequest;
  return null;
}

/**
 * Load all accepted matches for a user.
 * Returns the partner profiles (with instagramHandle populated).
 */
export async function loadAcceptedMatches(uid: string): Promise<Profile[]> {
  const [q1snap, q2snap] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid), where("status", "==", "accepted"))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid), where("status", "==", "accepted"))),
  ]);

  const partnerIds = new Set<string>();
  q1snap.docs.forEach((d) => partnerIds.add((d.data() as RoommateRequest).toUid));
  q2snap.docs.forEach((d) => partnerIds.add((d.data() as RoommateRequest).fromUid));

  const profiles = await Promise.all([...partnerIds].map((pid) => loadProfile(pid)));
  return profiles.filter((p): p is Profile => p !== null);
}

/**
 * Load all pending requests for a user — both sent and received.
 * Returns array of { profile, direction } so the UI can label them correctly.
 */
export async function loadPendingRequests(
  uid: string,
): Promise<{ profile: Profile; direction: "sent" | "received" }[]> {
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid), where("status", "==", "pending"))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid), where("status", "==", "pending"))),
  ]);

  const results: { profile: Profile; direction: "sent" | "received" }[] = [];

  await Promise.all([
    ...sentSnap.docs.map(async (d) => {
      const req = d.data() as RoommateRequest;
      const profile = await loadProfile(req.toUid);
      if (profile) results.push({ profile, direction: "sent" });
    }),
    ...receivedSnap.docs.map(async (d) => {
      const req = d.data() as RoommateRequest;
      const profile = await loadProfile(req.fromUid);
      if (profile) results.push({ profile, direction: "received" });
    }),
  ]);

  return results;
}

/**
 * Subscribe (real-time) to incoming pending requests for a user.
 * Calls cb immediately and on every change.
 * Returns the unsubscribe function.
 */
export function subscribeIncomingRequests(
  uid: string,
  cb: (reqs: RoommateRequest[]) => void,
): () => void {
  const q = query(
    collection(db, "requests"),
    where("toUid",  "==", uid),
    where("status", "==", "pending"),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as RoommateRequest));
  });
}
