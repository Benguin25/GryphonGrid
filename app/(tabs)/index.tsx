import { View, Text, Image, FlatList, Pressable, StyleSheet, Platform } from "react-native";
import { MOCK_PROFILES } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { router } from "expo-router";

const SLEEP_LABELS: Record<string, string> = {
  early: "🌅 Early riser",
  normal: "🌤 Normal",
  "night-owl": "🌙 Night owl",
  shift: "🔄 Shift worker",
};

const LEASE_LABELS: Record<string, string> = {
  "4-months": "4 mo",
  "8-months": "8 mo",
  "12-plus": "12+ mo",
};

function ProfileCard({ item }: { item: Profile }) {
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
        <View style={styles.cardHeader}>
          <Text style={styles.name}>
            {item.firstName}{item.age ? `, ${item.age}` : ""}
          </Text>
          <View style={styles.leaseBadge}>
            <Text style={styles.leaseBadgeText}>{LEASE_LABELS[item.leaseDuration]}</Text>
          </View>
        </View>

        <Text style={styles.program}>{item.program}</Text>

        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>

        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{SLEEP_LABELS[item.sleepSchedule]}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🧹 {item.cleanliness}/5</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🗣 {item.socialEnergy}/5</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_PROFILES}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <ProfileCard item={item} />}
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
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  leaseBadge: {
    backgroundColor: "#f0edff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leaseBadgeText: {
    fontSize: 11,
    color: "#7c3aed",
    fontWeight: "600",
  },
  program: {
    fontSize: 13,
    color: "#7c3aed",
    fontWeight: "500",
  },
  bio: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginTop: 2,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: "#374151",
  },
});

