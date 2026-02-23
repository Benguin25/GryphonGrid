import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MOCK_PROFILES, computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";

const ME: Profile = {
  id: "me",
  name: "You",
  bio: "My profile",
  cleanliness: 4,
  socialEnergy: 3,
  hasDog: false,
  hasCat: false,
  petAllergy: "none",
  schedule: "day",
  prefCleanliness: 4,
  prefSocialEnergy: 3,
  prefPetsOk: true,
  prefSchedule: "any",
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = MOCK_PROFILES.find((p) => p.id === id);

  if (!profile) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  const match = computeMatch(ME, profile);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.score}>{match}%</Text>
      <Text style={styles.scoreLabel}>match</Text>

      <Pressable style={styles.requestBtn}>
        <Text style={styles.requestBtnText}>Request as roommate</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Me</Text>
        <Text style={styles.cardBody}>{profile.bio}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Compatibility</Text>
        <Text style={styles.cardBody}>Cleanliness: {profile.cleanliness}/5</Text>
        <Text style={styles.cardBody}>Social Energy: {profile.socialEnergy}/5</Text>
        <Text style={styles.cardBody}>Schedule: {profile.schedule}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  back: {
    color: "#7c3aed",
    fontSize: 16,
  },
  name: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: "bold",
  },
  score: {
    marginTop: 8,
    fontSize: 48,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  scoreLabel: {
    color: "#6b7280",
  },
  requestBtn: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
  },
  requestBtnText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardBody: {
    marginTop: 8,
    color: "#374151",
  },
});
