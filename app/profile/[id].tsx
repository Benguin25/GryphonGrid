import { View, Text, Image, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_PROFILES } from "../../lib/mock";
import { getJSON } from "../../lib/storage";
import { Profile } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";

const PURPLE = "#7c3aed";

const SLEEP_LABELS: Record<string, string> = {
  early: "🌅 Early riser",
  normal: "🌤 Normal",
  "night-owl": "🌙 Night owl",
  shift: "🔄 Shift worker",
};

const GUESTS_LABELS: Record<string, string> = {
  rarely: "Rarely",
  occasionally: "Occasionally",
  frequently: "Frequently",
};

const SUBSTANCE_LABELS: Record<string, string> = {
  "smoke-free": "🚭 Smoke-free only",
  "alcohol-ok": "🍺 Alcohol okay",
  "420-friendly": "🌿 420 friendly",
  "no-substances": "✅ No substances",
};

const NOISE_LABELS: Record<string, string> = {
  quiet: "🤫 Needs quiet",
  moderate: "🎵 Moderate",
  "background-ok": "🔊 Background noise OK",
};

const LEASE_LABELS: Record<string, string> = {
  "4-months": "4 months",
  "8-months": "8 months",
  "12-months": "12 months",
  "16-months": "16 months",
  "16-plus": "16+ months",
  "indefinite": "Indefinite",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ScaleRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={[styles.dot, value >= n && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (id === "me") {
      const key = `gryphongrid_profile_${user?.uid ?? "anonymous"}`;
      getJSON<Profile | null>(key, null).then(setProfile);
    } else {
      setProfile(MOCK_PROFILES.find((p) => p.id === id) ?? null);
    }
  }, [id, user?.uid]);

  const isPreview = id === "me";
  const insets = useSafeAreaInsets();

  if (profile === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Profile not found</Text>
      </View>
    );
  }

  const petInfo = [
    profile.hasDog && "🐶 Has dog",
    profile.hasCat && "🐱 Has cat",
    !profile.hasDog && !profile.hasCat && "No pets",
  ]
    .filter(Boolean)
    .join(" · ");

  const petAllergy =
    profile.petAllergy === "none" ? "None" : `Allergic to ${profile.petAllergy}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {/* Preview banner */}
      {isPreview && (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>👁 Preview — this is how others see your profile</Text>
        </View>
      )}

      {/* Photo + identity */}
      <Image
        source={{ uri: profile.photoUrl ?? `https://i.pravatar.cc/300?u=${profile.id}` }}
        style={styles.photo}
      />
      <Text style={styles.name}>
        {profile.firstName}{profile.age ? `, ${profile.age}` : ""}
      </Text>
      {profile.gender && (
        <Text style={styles.subtext}>{GENDER_LABELS[profile.gender] ?? profile.gender}</Text>
      )}
      <Text style={styles.program}>{profile.program}</Text>
      {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {/* Lifestyle */}
      <Section title="Lifestyle">
        <InfoRow label="Sleep schedule" value={SLEEP_LABELS[profile.sleepSchedule]} />
        <InfoRow label="Substance environment" value={SUBSTANCE_LABELS[profile.substanceEnv]} />
        <InfoRow label="Noise tolerance" value={NOISE_LABELS[profile.noiseTolerance]} />
        <InfoRow label="Has guests" value={GUESTS_LABELS[profile.guestsFrequency]} />
      </Section>

      {/* My levels */}
      <Section title="My levels">
        <ScaleRow label="Cleanliness" value={profile.cleanliness} />
        <ScaleRow label="Social energy" value={profile.socialEnergy} />
      </Section>

      {/* Pets */}
      <Section title="Pets">
        <InfoRow label="My pets" value={petInfo} />
        <InfoRow label="Pet allergies" value={petAllergy} />
        <InfoRow label="Open to living with pets" value={profile.openToPets ? "Yes" : "No"} />
      </Section>

      {/* Living intent */}
      <Section title="Living Intent">
        <InfoRow label="Lease duration" value={LEASE_LABELS[profile.leaseDuration]} />
        {!!profile.moveInDate && (
          <InfoRow label="Move-in date" value={profile.moveInDate} />
        )}
        {(profile.budgetMin || profile.budgetMax) && (
          <InfoRow
            label="Budget"
            value={[
              profile.budgetMin && `$${profile.budgetMin}`,
              profile.budgetMax && `$${profile.budgetMax}`,
            ]
              .filter(Boolean)
              .join(" – ")}
          />
        )}
      </Section>

      {!isPreview && (
        <Pressable style={styles.requestBtn}>
          <Text style={styles.requestBtnText}>Request as roommate</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: "#6b7280" },
  backBtn: { marginBottom: 16 },
  backText: { color: PURPLE, fontSize: 16, fontWeight: "500" },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
    alignSelf: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
  },
  subtext: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 2,
  },
  program: {
    fontSize: 15,
    color: PURPLE,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 13, color: "#111", fontWeight: "500", maxWidth: "55%", textAlign: "right" },
  dots: { flexDirection: "row", gap: 5 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e5e7eb",
  },
  dotFilled: { backgroundColor: PURPLE },
  requestBtn: {
    marginTop: 28,
    backgroundColor: PURPLE,
    borderRadius: 999,
    paddingVertical: 16,
  },
  requestBtnText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  previewBanner: {
    backgroundColor: "#f0edff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  previewBannerText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
