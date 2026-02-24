import { View, Text, Image, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { loadProfile, loadAcceptedMatches } from "../../lib/db";

const PURPLE = "#7c3aed";

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
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadProfile(user.uid).then((p) => {
      if (p) setMe(p);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadAcceptedMatches(user.uid)
      .then(setMatches)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
          const score = computeMatch(me, item);
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/profile/${item.id}`)}
            >
              <Image
                source={{ uri: item.photoUrl ?? `https://i.pravatar.cc/300?u=${item.id}` }}
                style={styles.photo}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>
                  {item.firstName}{item.age ? `, ${item.age}` : ""}
                </Text>
                <Text style={styles.cardProgram}>{item.program}</Text>
                {item.instagramHandle ? (
                  <View style={styles.igRow}>
                    <Text style={styles.igIcon}>📸</Text>
                    <Text style={styles.igHandle}>@{item.instagramHandle}</Text>
                  </View>
                ) : (
                  <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
                )}
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.score, { color: matchColor(score) }]}>{score}%</Text>
                <Text style={styles.scoreLabel}>match</Text>
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
  cardBody: { flex: 1, gap: 2 },
  cardName:    { fontSize: 16, fontWeight: "700", color: "#111" },
  cardProgram: { fontSize: 12, color: PURPLE, fontWeight: "500" },
  cardBio:     { fontSize: 12, color: "#6b7280", lineHeight: 17, marginTop: 2 },
  igRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  igIcon:   { fontSize: 13 },
  igHandle: { fontSize: 13, fontWeight: "600", color: "#111" },
  scoreCol:   { alignItems: "center", minWidth: 48 },
  score:      { fontSize: 22, fontWeight: "800" },
  scoreLabel: { fontSize: 11, color: "#9ca3af", marginTop: -2 },
});
