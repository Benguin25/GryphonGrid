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
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, onSnapshot,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { Platform } from "react-native";
import { db, firebaseAuth } from "./firebase";
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
  // Firestore rejects undefined values – strip them before saving
  const clean = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined)
  );
  await setDoc(doc(db, "users", uid), clean, { merge: true });
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

/**
 * Returns the UIDs of everyone the user has any request relationship with
 * (pending sent, pending received, or accepted). Used to filter Discover.
 */
export async function loadRelatedUids(uid: string): Promise<Set<string>> {
  const [s1, s2] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid))),
  ]);
  const uids = new Set<string>();
  s1.docs.forEach((d) => { const r = d.data(); uids.add(r.toUid); });
  s2.docs.forEach((d) => { const r = d.data(); uids.add(r.fromUid); });
  return uids;
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

/** Accept or decline an incoming request. When accepting, also removes any
 *  reverse-direction pending request so the pair only appears once. */
export async function respondToRequest(
  requestId: string,
  status: "accepted" | "declined",
): Promise<void> {
  await updateDoc(doc(db, "requests", requestId), { status });

  if (status === "accepted") {
    // Clean up any stale reverse-direction pending doc (e.g. if both users
    // had sent requests to each other).
    const acceptedSnap = await getDoc(doc(db, "requests", requestId));
    if (acceptedSnap.exists()) {
      const { fromUid, toUid } = acceptedSnap.data() as { fromUid: string; toUid: string };
      const reverseId = `${toUid}_${fromUid}`;
      if (reverseId !== requestId) {
        const reverseSnap = await getDoc(doc(db, "requests", reverseId));
        if (reverseSnap.exists()) await deleteDoc(doc(db, "requests", reverseId));
      }
    }
  }
}

/**
 * Get the request between two users (either direction).
 * Returns null if no request exists.
 */
export async function getRequestBetween(
  uid1: string,
  uid2: string,
): Promise<RoommateRequest | null> {
  // Try each direction independently so a permission error on the non-existent
  // doc ID doesn't cause the whole call to reject.
  const tryGet = async (docId: string) => {
    try { return await getDoc(doc(db, "requests", docId)); }
    catch { return null; }
  };
  const [s1, s2] = await Promise.all([
    tryGet(`${uid1}_${uid2}`),
    tryGet(`${uid2}_${uid1}`),
  ]);
  if (s1?.exists()) return { ...(s1.data() as RoommateRequest), id: s1.id };
  if (s2?.exists()) return { ...(s2.data() as RoommateRequest), id: s2.id };
  return null;
}

/**
 * Returns the request between uid and otherUid using single-field collection
 * queries (no composite index required). Reliable fallback for profile pages.
 * Prefers accepted > pending so a matched pair is never shown as pending.
 */
export async function getRelationshipWithUser(
  uid: string,
  otherUid: string,
): Promise<RoommateRequest | null> {
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid))),
  ]);
  const sentDoc     = sentSnap.docs.find((d)     => d.data().toUid   === otherUid);
  const receivedDoc = receivedSnap.docs.find((d) => d.data().fromUid === otherUid);

  // If both exist, prefer whichever is accepted so a matched pair is never
  // mis-identified as still pending.
  let d = sentDoc ?? receivedDoc;
  if (sentDoc && receivedDoc) {
    d = sentDoc.data().status === "accepted" ? sentDoc : receivedDoc;
  }
  if (!d) return null;
  return { ...(d.data() as RoommateRequest), id: d.id };
}

/**
 * Load all accepted matches for a user.
 * Returns the partner profiles with their request document ID.
 */
export async function loadAcceptedMatches(uid: string): Promise<{ profile: Profile; reqId: string }[]> {
  const [q1snap, q2snap] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid), where("status", "==", "accepted"))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid), where("status", "==", "accepted"))),
  ]);

  const entries: { partnerId: string; reqId: string }[] = [
    ...q1snap.docs.map((d) => ({ partnerId: (d.data() as RoommateRequest).toUid,   reqId: d.id })),
    ...q2snap.docs.map((d) => ({ partnerId: (d.data() as RoommateRequest).fromUid, reqId: d.id })),
  ];

  // de-dupe by partnerId
  const seen = new Set<string>();
  const unique = entries.filter(({ partnerId }) => {
    if (seen.has(partnerId)) return false;
    seen.add(partnerId);
    return true;
  });

  const results = await Promise.all(
    unique.map(async ({ partnerId, reqId }) => {
      const p = await loadProfile(partnerId);
      return p ? { profile: p, reqId } : null;
    })
  );
  return results.filter((r): r is { profile: Profile; reqId: string } => r !== null);
}

/**
 * Load all pending requests for a user — both sent and received.
 * Returns array of { profile, direction } so the UI can label them correctly.
 * Excludes any pending entry whose partner is already in an accepted match
 * (handles stale docs left over from mutual-send scenarios).
 */
export async function loadPendingRequests(
  uid: string,
): Promise<{ profile: Profile; direction: "sent" | "received" }[]> {
  const [sentSnap, receivedSnap, acceptedSnap1, acceptedSnap2] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid), where("status", "==", "pending"))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid), where("status", "==", "pending"))),
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid), where("status", "==", "accepted"))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid), where("status", "==", "accepted"))),
  ]);

  const acceptedPartners = new Set<string>([
    ...acceptedSnap1.docs.map((d) => (d.data() as RoommateRequest).toUid),
    ...acceptedSnap2.docs.map((d) => (d.data() as RoommateRequest).fromUid),
  ]);

  const results: { profile: Profile; direction: "sent" | "received" }[] = [];

  await Promise.all([
    ...sentSnap.docs.map(async (d) => {
      const req = d.data() as RoommateRequest;
      if (acceptedPartners.has(req.toUid)) return; // already matched
      const profile = await loadProfile(req.toUid);
      if (profile) results.push({ profile, direction: "sent" });
    }),
    ...receivedSnap.docs.map(async (d) => {
      const req = d.data() as RoommateRequest;
      if (acceptedPartners.has(req.fromUid)) return; // already matched
      const profile = await loadProfile(req.fromUid);
      if (profile) results.push({ profile, direction: "received" });
    }),
  ]);

  return results;
}

/**
 * Unmatch two users — marks the accepted request as "declined".
 * Works regardless of which user initiated the original request.
 */
export async function unmatchUsers(uid1: string, uid2: string): Promise<void> {
  const [s1, s2] = await Promise.all([
    getDoc(doc(db, "requests", `${uid1}_${uid2}`)),
    getDoc(doc(db, "requests", `${uid2}_${uid1}`)),
  ]);
  if (s1.exists()) await deleteDoc(doc(db, "requests", `${uid1}_${uid2}`));
  if (s2.exists()) await deleteDoc(doc(db, "requests", `${uid2}_${uid1}`));
}

/**
 * Permanently delete a user account:
 *  1. Deletes all sent/received request documents.
 *  2. Deletes the Firestore user document.
 *  3. Deletes the Firebase Auth account.
 */
export async function deleteAccount(uid: string): Promise<void> {
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("fromUid", "==", uid))),
    getDocs(query(collection(db, "requests"), where("toUid",   "==", uid))),
  ]);
  await Promise.all([
    ...sentSnap.docs.map((d) => deleteDoc(d.ref)),
    ...receivedSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
  await deleteDoc(doc(db, "users", uid));
  if (firebaseAuth.currentUser) {
    await deleteUser(firebaseAuth.currentUser);
  }
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
