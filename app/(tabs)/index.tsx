import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  Platform,
  UIManager,
} from "react-native";
import { useState, useMemo, useEffect } from "react";
import { MOCK_PROFILES, computeMatch } from "../../lib/mock";
import { Profile, LeaseDuration } from "../../lib/types";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getJSON } from "../../lib/storage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PURPLE = "#7c3aed";

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

function matchColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function ProfileCard({ item, score, showScore }: { item: Profile; score?: number; showScore: boolean }) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/profile/${item.id}`)}>
      <Image
        source={{ uri: item.photoUrl ?? `https://i.pravatar.cc/300?u=${item.id}` }}
        style={styles.photo}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {item.firstName}{item.age ? `, ${item.age}` : ""}
          </Text>
          <View style={styles.badgeRow}>
            {showScore && score !== undefined && (
              <View style={[styles.scoreBadge, { backgroundColor: matchColor(score) + "18", borderColor: matchColor(score) + "55" }]}>
                <Text style={[styles.scoreBadgeText, { color: matchColor(score) }]}>{score}%</Text>
              </View>
            )}
            <View style={styles.leaseBadge}>
              <Text style={styles.leaseBadgeText}>{LEASE_LABELS[item.leaseDuration]}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.program}>{item.program}</Text>
        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}><Text style={styles.tagText}>{SLEEP_LABELS[item.sleepSchedule]}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>🧹 {item.cleanliness}/5</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>🗣 {item.socialEnergy}/5</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

const LEASE_OPTIONS: { value: LeaseDuration | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "4-months", label: "4 mo" },
  { value: "8-months", label: "8 mo" },
  { value: "12-plus", label: "12+ mo" },
];

type SortKey = "default" | "match" | "age-asc" | "age-desc" | "name";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "match", label: "Match %" },
  { value: "name", label: "Name" },
  { value: "age-asc", label: "Age ↑" },
  { value: "age-desc", label: "Age ↓" },
];

const FALLBACK_ME: Profile = {
  id: "me", firstName: "", program: "", bio: "",
  sleepSchedule: "normal", cleanliness: 3, prefCleanliness: 3,
  socialEnergy: 3, prefSocialEnergy: 3, guestsFrequency: "occasionally",
  prefGuestsFrequency: "occasionally", substanceEnv: "smoke-free",
  hasDog: false, hasCat: false, petAllergy: "none", openToPets: true,
  noiseTolerance: "moderate", leaseDuration: "8-months",
};

export default function DiscoverScreen() {
  const { user } = useAuth();
  const [me, setMe] = useState<Profile>(FALLBACK_ME);

  useEffect(() => {
    if (!user) return;
    getJSON<Profile>(`gryphongrid_profile_${user.uid}`, FALLBACK_ME).then((p) =>
      setMe({ ...FALLBACK_ME, ...p, id: user.uid })
    );
  }, [user?.uid]);

  const [query, setQuery] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [leaseFilter, setLeaseFilter] = useState<LeaseDuration | "any">("any");
  const [showScore, setShowScore] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("default");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minAge = ageMin ? parseInt(ageMin, 10) : undefined;
    const maxAge = ageMax ? parseInt(ageMax, 10) : undefined;

    const filtered = MOCK_PROFILES
      .map((p) => ({ profile: p, score: computeMatch(me, p) }))
      .filter(({ profile: p }) => {
        if (q && !`${p.firstName} ${p.program} ${p.bio}`.toLowerCase().includes(q)) return false;
        if (minAge !== undefined && (p.age === undefined || p.age < minAge)) return false;
        if (maxAge !== undefined && (p.age === undefined || p.age > maxAge)) return false;
        if (leaseFilter !== "any" && p.leaseDuration !== leaseFilter) return false;
        return true;
      });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "match":    return b.score - a.score;
        case "name":     return a.profile.firstName.localeCompare(b.profile.firstName);
        case "age-asc":  return (a.profile.age ?? 99) - (b.profile.age ?? 99);
        case "age-desc": return (b.profile.age ?? 0) - (a.profile.age ?? 0);
        default:         return 0;
      }
    });
  }, [query, ageMin, ageMax, leaseFilter, sortBy, me]);

  const listHeader = (
    <>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, major, interests…"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter panel */}
      <View style={styles.filterPanel}>
        {/* Row 1: Age + Lease */}
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Age</Text>
            <View style={styles.ageRow}>
              <TextInput
                style={styles.ageInput}
                placeholder="Min"
                placeholderTextColor="#9ca3af"
                value={ageMin}
                onChangeText={setAgeMin}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.ageSep}>–</Text>
              <TextInput
                style={styles.ageInput}
                placeholder="Max"
                placeholderTextColor="#9ca3af"
                value={ageMax}
                onChangeText={setAgeMax}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.filterDivider} />

          <View style={[styles.filterGroup, { flex: 1 }]}>
            <Text style={styles.filterLabel}>Lease</Text>
            <View style={styles.chipWrap}>
              {LEASE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, leaseFilter === opt.value && styles.chipActive]}
                  onPress={() => setLeaseFilter(opt.value)}
                >
                  <Text style={[styles.chipText, leaseFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Row 2: Sort + Match toggle */}
        <View style={styles.filterRow}>
          <View style={[styles.filterGroup, { flex: 1 }]}>
            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.chipWrap}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, sortBy === opt.value && styles.sortChipActive]}
                  onPress={() => setSortBy(opt.value)}
                >
                  <Text style={[styles.chipText, sortBy === opt.value && styles.sortChipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.compatToggle}>
            <Text style={styles.compatLabel}>Show Match %</Text>
            <Switch
              value={showScore}
              onValueChange={setShowScore}
              trackColor={{ false: "#e5e7eb", true: PURPLE }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      </View>

      {/* Result count */}
      <Text style={styles.resultCount}>{results.length} {results.length === 1 ? "person" : "people"} found</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(x) => x.profile.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <ProfileCard item={item.profile} score={item.score} showScore={showScore} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No profiles match your filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },

  // Search
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  clearBtn: { fontSize: 13, color: "#9ca3af", paddingHorizontal: 2 },

  // Filter panel
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ageInput: {
    width: 44,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#f9fafb",
    textAlign: "center",
  },
  ageSep: { fontSize: 13, color: "#9ca3af" },
  filterDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
    marginTop: 18,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f9fafb",
  },
  chipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  sortChipActive: { backgroundColor: "#f0edff", borderColor: PURPLE },
  sortChipTextActive: { color: PURPLE, fontWeight: "700" },
  compatToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto" as any,
    marginTop: 16,
  },
  compatLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },

  // Result count
  resultCount: {
    fontSize: 12,
    color: "#9ca3af",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
  photo: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#e5e7eb" },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  name: { fontSize: 17, fontWeight: "700", color: "#111", flex: 1 },
  scoreBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scoreBadgeText: { fontSize: 11, fontWeight: "700" },
  leaseBadge: {
    backgroundColor: "#f0edff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leaseBadgeText: { fontSize: 11, color: PURPLE, fontWeight: "600" },
  program: { fontSize: 13, color: PURPLE, fontWeight: "500" },
  bio: { fontSize: 13, color: "#6b7280", lineHeight: 18, marginTop: 2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: "#374151" },

  // Empty
  empty: { alignItems: "center", paddingTop: 48 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
});
