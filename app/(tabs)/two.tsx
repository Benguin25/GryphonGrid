import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { loadProfile } from "../../lib/db";
import { Profile } from "../../lib/types";

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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function MyProfileTab() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadProfile(user.uid).then(setProfile);
    }, [user?.uid])
  );

  if (profile === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PURPLE} />
      </View>
    );
  }

  if (!profile || !profile.firstName) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyTitle}>No profile yet</Text>
        <Text style={styles.emptySub}>Complete onboarding to set up your profile.</Text>
        <Pressable style={styles.editBtn} onPress={() => router.push("/edit-profile")}>
          <Text style={styles.editBtnText}>Set up profile</Text>
        </Pressable>
      </View>
    );
  }

  const myPets = [
    profile.hasDog && "🐶 Dog",
    profile.hasCat && "🐱 Cat",
    !profile.hasDog && !profile.hasCat && "No pets",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
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

      <Pressable style={styles.editBtn} onPress={() => router.push("/edit-profile")}>
        <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
      </Pressable>

      <Card title="Lifestyle">
        <InfoRow label="Sleep schedule" value={SLEEP_LABELS[profile.sleepSchedule]} />
        <InfoRow label="Substance environment" value={SUBSTANCE_LABELS[profile.substanceEnv]} />
        <InfoRow label="Noise tolerance" value={NOISE_LABELS[profile.noiseTolerance]} />
        <InfoRow label="Has guests" value={GUESTS_LABELS[profile.guestsFrequency]} />
      </Card>

      <Card title="My levels">
        <ScaleRow label="Cleanliness" value={profile.cleanliness} />
        <ScaleRow label="Social energy" value={profile.socialEnergy} />
      </Card>

      <Card title="Pets">
        <InfoRow label="My pets" value={myPets} />
        <InfoRow
          label="Pet allergies"
          value={profile.petAllergy === "none" ? "None" : `Allergic to ${profile.petAllergy}`}
        />
        <InfoRow label="Open to living with pets" value={profile.openToPets ? "Yes ✓" : "No"} />
      </Card>

      <Card title="Living Intent">
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
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 12,
  },
  name: { fontSize: 26, fontWeight: "800", textAlign: "center", color: "#111" },
  subtext: { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 2 },
  program: { fontSize: 15, color: PURPLE, fontWeight: "600", textAlign: "center", marginTop: 4 },
  bio: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  editBtn: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#f0edff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  editBtnText: { color: PURPLE, fontSize: 14, fontWeight: "700" },
  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 13, color: "#111", fontWeight: "500", maxWidth: "55%", textAlign: "right" },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e5e7eb" },
  dotFilled: { backgroundColor: PURPLE },
});
