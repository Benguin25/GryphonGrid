import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState, useEffect } from "react";
import { computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { loadProfile, loadAcceptedMatches, loadPendingRequests } from "../../lib/db";

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
  const [accepted, setAccepted] = useState<Profile[]>([]);
  const [pending, setPending] = useState<{ profile: Profile; direction: "sent" | "received" }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  }

  type ListItem =
    | { kind: "accepted"; profile: Profile }
    | { kind: "pending";  profile: Profile; direction: "sent" | "received" };

  const sections = [
    ...(accepted.length > 0 ? [{
      title: "✅ Matched",
      data: accepted.map((p): ListItem => ({ kind: "accepted", profile: p })),
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
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/profile/${item.profile.id}`)}
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
              <View style={styles.scoreCol}>
                <Text style={[styles.score, { color: matchColor(score) }]}>{score}%</Text>
                <Text style={styles.scoreLabel}>match</Text>
                {!isAccepted && (
                  <View style={[styles.pendingBadge, isSent ? styles.pendingBadgeSent : styles.pendingBadgeReceived]}>
                    <Text style={styles.pendingBadgeText}>{isSent ? "Sent" : "Incoming"}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
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
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
  pendingBadgeReceived: { backgroundColor: "#FFF8E1" }, // UofG Gold tint
  pendingBadgeText: { fontSize: 9, fontWeight: "700", color: "#374151" },
});
