import { View, Text, Image, Pressable, FlatList, StyleSheet } from "react-native";
import { useMemo } from "react";
import { MOCK_PROFILES, computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router } from "expo-router";

// Placeholder "me" — will eventually come from saved profile in AsyncStorage
const ME: Profile = {
  id: "me",
  firstName: "You",
  program: "Student",
  bio: "My profile",
  sleepSchedule: "normal",
  cleanliness: 3,
  prefCleanliness: 3,
  socialEnergy: 3,
  prefSocialEnergy: 3,
  guestsFrequency: "occasionally",
  prefGuestsFrequency: "occasionally",
  substanceEnv: "smoke-free",
  hasDog: false,
  hasCat: false,
  petAllergy: "none",
  openToPets: true,
  noiseTolerance: "moderate",
  leaseDuration: "8-months",
};

function matchColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

export default function MatchesScreen() {
  const matches = useMemo(() => {
    return MOCK_PROFILES.map((p) => ({
      profile: p,
      score: computeMatch(ME, p),
    })).sort((a, b) => b.score - a.score);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(x) => x.profile.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/profile/${item.profile.id}`)}
          >
            <Image
              source={{ uri: item.profile.photoUrl ?? `https://i.pravatar.cc/300?u=${item.profile.id}` }}
              style={styles.photo}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>
                {item.profile.firstName}{item.profile.age ? `, ${item.profile.age}` : ""}
              </Text>
              <Text style={styles.cardProgram}>{item.profile.program}</Text>
              <Text style={styles.cardBio} numberOfLines={2}>{item.profile.bio}</Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={[styles.score, { color: matchColor(item.score) }]}>{item.score}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
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
  photo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  cardProgram: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "500",
  },
  cardBio: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: "center",
    minWidth: 48,
  },
  score: {
    fontSize: 22,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: -2,
  },
});
