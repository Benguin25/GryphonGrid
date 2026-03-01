import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState, useEffect, useCallback } from "react";
import { computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { loadProfile, loadAcceptedMatches, loadPendingRequests, respondToRequest } from "../../lib/db";
import AppDialog from "../../components/AppDialog";

const RED = "#CC0000";

const FALLBACK_ME: Profile = {
  id: "me", firstName: "", program: "", bio: "",
  sleepSchedule: "normal", cleanliness: 3, prefCleanliness: 3,
  socialEnergy: 3, prefSocialEnergy: 3, guestsFrequency: "occasionally",
  prefGuestsFrequency: "occasionally", substanceEnv: "smoke-free",
  hasDog: false, hasCat: false, petAllergy: "none", openToPets: true,
  noiseTolerance: "moderate", leaseDuration: "8-months",
};

function matchColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

export default function MatchesScreen() {
  const { user } = useAuth();
  const [me, setMe] = useState<Profile>(FALLBACK_ME);
  const [accepted, setAccepted] = useState<{ profile: Profile; reqId: string }[]>([]);
  const [pending, setPending] = useState<{ profile: Profile; direction: "sent" | "received" }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);
  const [confirmUnmatch, setConfirmUnmatch] = useState<{ profile: Profile; reqId: string } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const fetchData = (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    Promise.all([
      loadProfile(user.uid),
      loadAcceptedMatches(user.uid),
      loadPendingRequests(user.uid),
    ]).then(([p, acc, pend]) => {
      if (p) setMe(p);
      setAccepted(acc);
      setPending(pend);
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  function handleUnmatch(item: { profile: Profile; reqId: string }) {
    if (!user) return;
    setConfirmUnmatch(item);
  }

  async function doUnmatch() {
    if (!user || !confirmUnmatch) return;
    const target = confirmUnmatch;
    setConfirmUnmatch(null);
    setUnmatchingId(target.profile.id);
    try {
      await respondToRequest(target.reqId, "declined");
      setAccepted((prev) => prev.filter((p) => p.profile.id !== target.profile.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDialogError(`Could not unmatch: ${msg}`);
    } finally {
      setUnmatchingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  }

  type ListItem =
    | { kind: "accepted"; profile: Profile; reqId: string }
    | { kind: "pending";  profile: Profile; direction: "sent" | "received" };

  const sections = [
    ...(accepted.length > 0 ? [{
      title: "\u2705 Matched",
      data: accepted.map((a): ListItem => ({ kind: "accepted", profile: a.profile, reqId: a.reqId })),
    }] : []),
    ...(pending.length > 0 ? [{
      title: "⏳ Pending",
      data: pending.map((x): ListItem => ({ kind: "pending", profile: x.profile, direction: x.direction })),
    }] : []),
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={RED}
            colors={[RED]}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySub}>
              Browse Discover and send roommate requests.{"\n"}When someone accepts, they appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const score = computeMatch(me, item.profile);
          const isAccepted = item.kind === "accepted";
          const isSent     = item.kind === "pending" && item.direction === "sent";
          return (
            <View style={styles.card}>
              <Pressable
                style={styles.cardTouchable}
                onPress={() => {
                  if (item.kind === 'pending') {
                    router.push({
                      pathname: `/profile/${item.profile.id}`,
                      params: { pendingDirection: item.direction },
                    });
                  } else {
                    router.push(`/profile/${item.profile.id}`);
                  }
                }}
              >
                {item.profile.photoUrl ? (
                  <Image
                    source={{ uri: item.profile.photoUrl }}
                    style={styles.photo}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <FontAwesome name="user" size={38} color="#bdc3ca" style={{ marginTop: 8 }} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>
                    {item.profile.firstName}{item.profile.age ? `, ${item.profile.age}` : ""}
                  </Text>
                  <Text style={styles.cardProgram}>{item.profile.program}</Text>
                  {isAccepted && item.profile.instagramHandle ? (
                    <View style={styles.igRow}>
                      <Text style={styles.igIcon}>📸</Text>
                      <Text style={styles.igHandle}>@{item.profile.instagramHandle}</Text>
                    </View>
                  ) : (
                    <Text style={styles.cardBio} numberOfLines={2}>{item.profile.bio}</Text>
                  )}
                </View>
              </Pressable>
              <View style={styles.scoreCol}>
                <Text style={[styles.score, { color: matchColor(score) }]}>{score}%</Text>
                <Text style={styles.scoreLabel}>match</Text>
                {isAccepted && (
                  <Pressable
                    onPress={() => isAccepted && item.kind === "accepted" && handleUnmatch({ profile: item.profile, reqId: item.reqId })}
                    style={styles.unmatchBtn}
                    disabled={unmatchingId === item.profile.id}
                  >
                    {unmatchingId === item.profile.id
                      ? <ActivityIndicator size="small" color="#dc2626" />
                      : <Text style={styles.unmatchBtnText}>Unmatch</Text>
                    }
                  </Pressable>
                )}
                {!isAccepted && (
                  <View style={[styles.pendingBadge, isSent ? styles.pendingBadgeSent : styles.pendingBadgeReceived]}>
                    <Text style={styles.pendingBadgeText}>{isSent ? "Sent" : "Incoming"}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
      <AppDialog
        visible={!!confirmUnmatch}
        title="Unmatch"
        message={`Are you sure you want to unmatch with ${confirmUnmatch?.profile.firstName}? This cannot be undone.`}
        confirmText="Unmatch"
        cancelText="Cancel"
        destructive
        loading={unmatchingId === confirmUnmatch?.profile.id}
        onConfirm={doUnmatch}
        onCancel={() => setConfirmUnmatch(null)}
      />
      <AppDialog
        visible={!!dialogError}
        title="Error"
        message={dialogError ?? ""}
        confirmText="OK"
        onConfirm={() => setDialogError(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  centered:  { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 8 },
  emptySub:   { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photo: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#e5e7eb" },
  photoPlaceholder: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardName:    { fontSize: 16, fontWeight: "700", color: "#111" },
  cardProgram: { fontSize: 12, color: RED, fontWeight: "500" },
  cardBio:     { fontSize: 12, color: "#6b7280", lineHeight: 17, marginTop: 2 },
  igRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  igIcon:   { fontSize: 13 },
  igHandle: { fontSize: 13, fontWeight: "600", color: "#111" },
  scoreCol:   { alignItems: "center", minWidth: 48 },
  score:      { fontSize: 22, fontWeight: "800" },
  scoreLabel: { fontSize: 11, color: "#9ca3af", marginTop: -2 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 16,
  },
  pendingBadge: {
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
  },
  pendingBadgeSent:     { backgroundColor: "#FFF0F0" },
  pendingBadgeReceived: { backgroundColor: "#FFF8E1" },
  pendingBadgeText: { fontSize: 9, fontWeight: "700", color: "#374151" },
  unmatchBtn: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 56,
  },
  unmatchBtnText: { fontSize: 9, fontWeight: '700', color: '#dc2626' },
});
