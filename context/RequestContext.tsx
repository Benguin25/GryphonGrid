/**
 * RequestContext
 * ──────────────
 * Subscribes to incoming pending roommate requests in real-time.
 * Shows an in-app modal popup when a new request arrives.
 * Exposes helpers for sending/responding to requests.
 */

import React, {
  createContext, useContext, useEffect, useRef, useState,
} from "react";
import {
  Modal, View, Text, Pressable, Image, StyleSheet, ActivityIndicator, Keyboard,
} from "react-native";
import { RoommateRequest } from "../lib/types";
import {
  subscribeIncomingRequests,
  respondToRequest,
  sendRoommateRequest,
  getRequestBetween,
  loadProfile,
} from "../lib/db";
import { useAuth } from "./AuthContext";
import { Profile } from "../lib/types";

const RED = "#CC0000";

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestContextType = {
  /** Send a roommate request to another user. Returns "sent"|"already_sent"|"already_matched". */
  sendRequest: (toUid: string) => Promise<"sent" | "already_sent" | "already_matched">;
  /** Get the current request relationship between current user and another user. */
  getRelationship: (otherUid: string) => Promise<RoommateRequest | null>;
  /** Accept or decline a pending request by its document ID. */
  respondRequest: (requestId: string, status: "accepted" | "declined") => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const RequestContext = createContext<RequestContextType>({
  sendRequest: async () => "sent",
  getRelationship: async () => null,
  respondRequest: async () => {},
});

export function useRequests() {
  return useContext(RequestContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<RoommateRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<RoommateRequest | null>(null);
  const [responding, setResponding] = useState(false);
  // Track which request IDs we've already shown so we don't re-show after dismiss
  const seenIds = useRef<Set<string>>(new Set());

  // Subscribe to live incoming requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeIncomingRequests(user.uid, (reqs) => {
      setPendingRequests(reqs);
      // Find the first one we haven't shown yet
      const unseen = reqs.find((r) => !seenIds.current.has(r.id));
      if (unseen && !currentRequest) {
        setCurrentRequest(unseen);
      }
    });
    return unsub;
  }, [user?.uid]);

  // When currentRequest is cleared, show the next unseen one
  useEffect(() => {
    if (!currentRequest) {
      const next = pendingRequests.find((r) => !seenIds.current.has(r.id));
      if (next) setCurrentRequest(next);
    }
  }, [currentRequest, pendingRequests]);

  async function handleRespond(status: "accepted" | "declined") {
    if (!currentRequest) return;
    setResponding(true);
    try {
      await respondToRequest(currentRequest.id, status);
      seenIds.current.add(currentRequest.id);
      setCurrentRequest(null);
    } finally {
      setResponding(false);
    }
  }

  async function sendRequest(toUid: string): Promise<"sent" | "already_sent" | "already_matched"> {
    if (!user?.uid) return "sent";
    const existing = await getRequestBetween(user.uid, toUid);
    if (existing?.status === "accepted") return "already_matched";
    if (existing?.status === "pending")  return "already_sent";
    const myProfile = await loadProfile(user.uid);
    await sendRoommateRequest(user.uid, myProfile ?? ({ firstName: "Someone" } as Profile), toUid);
    return "sent";
  }

  async function getRelationship(otherUid: string): Promise<RoommateRequest | null> {
    if (!user?.uid) return null;
    return getRequestBetween(user.uid, otherUid);
  }

  async function respondRequest(requestId: string, status: "accepted" | "declined") {
    await respondToRequest(requestId, status);
    // If this was the popup request, dismiss it too
    if (currentRequest?.id === requestId) {
      seenIds.current.add(requestId);
      setCurrentRequest(null);
    }
  }

  return (
    <RequestContext.Provider value={{ sendRequest, getRelationship, respondRequest }}>
      {children}

      {/* ── Incoming request popup ───────────────────────────────────────── */}
      <Modal
        visible={!!currentRequest}
        transparent
        animationType="fade"
        onShow={() => Keyboard.dismiss()}
        onRequestClose={() => {
          if (currentRequest) seenIds.current.add(currentRequest.id);
          setCurrentRequest(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🏠</Text>
            <Text style={styles.title}>Roommate Request!</Text>

            {currentRequest?.fromPhoto ? (
              <Image
                source={{ uri: currentRequest.fromPhoto }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoInitial}>
                  {(currentRequest?.fromName ?? "?")[0].toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{currentRequest?.fromName ?? "Someone"}</Text>
            <Text style={styles.subtitle}>wants to be your roommate</Text>

            <View style={styles.buttons}>
              <Pressable
                style={[styles.btn, styles.declineBtn]}
                onPress={() => handleRespond("declined")}
                disabled={responding}
              >
                {responding ? <ActivityIndicator color="#6b7280" size="small" /> : <Text style={styles.declineText}>Decline</Text>}
              </Pressable>
              <Pressable
                style={[styles.btn, styles.acceptBtn]}
                onPress={() => handleRespond("accepted")}
                disabled={responding}
              >
                {responding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptText}>Accept 🎉</Text>}
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                if (currentRequest) seenIds.current.add(currentRequest.id);
                setCurrentRequest(null);
              }}
              style={styles.laterBtn}
            >
              <Text style={styles.laterText}>Decide later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </RequestContext.Provider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  emoji: { fontSize: 36, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 16 },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: { fontSize: 32, fontWeight: "800", color: RED },
  name: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 24 },
  buttons: { flexDirection: "row", gap: 12, width: "100%" },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  acceptBtn:  { backgroundColor: RED },
  declineText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  acceptText:  { fontSize: 15, fontWeight: "700", color: "#fff" },
  laterBtn:  { marginTop: 14 },
  laterText: { fontSize: 13, color: "#9ca3af" },
});
