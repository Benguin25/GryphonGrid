import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useMemo } from "react";
import { MOCK_PROFILES, computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router } from "expo-router";

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

export default function Matches() {
  const matches = useMemo(() => {
    return MOCK_PROFILES.map((p) => ({
      profile: p,
      match: computeMatch(ME, p),
    })).sort((a, b) => b.match - a.match);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Matches</Text>

      <FlatList
        style={styles.list}
        data={matches}
        keyExtractor={(x) => x.profile.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/profile/${item.profile.id}`)}
            style={styles.card}
          >
            <Text style={styles.cardName}>{item.profile.name}</Text>
            <Text style={styles.cardBio} numberOfLines={2}>
              {item.profile.bio}
            </Text>
            <Text style={styles.cardScore}>{item.match}%</Text>
            <Text style={styles.cardScoreLabel}>match</Text>
          </Pressable>
        )}
      />
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
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  list: {
    marginTop: 16,
  },
  separator: {
    height: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 16,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardBio: {
    marginTop: 4,
    color: "#4b5563",
  },
  cardScore: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  cardScoreLabel: {
    color: "#6b7280",
  },
});
