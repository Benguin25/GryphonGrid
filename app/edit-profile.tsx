import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getJSON, setJSON } from "../lib/storage";
import {
  Profile,
  SleepSchedule,
  GuestFrequency,
  SubstanceEnv,
  NoiseTolerance,
  LeaseDuration,
  Gender,
  Cleanliness,
  SocialEnergy,
  PetAllergy,
} from "../lib/types";
import { useAuth } from "../context/AuthContext";

const DEFAULT_PROFILE: Profile = {
  id: "me",
  firstName: "",
  age: undefined,
  gender: undefined,
  program: "",
  bio: "",
  photoUrl: "",
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
  openToPets: false,
  noiseTolerance: "moderate",
  leaseDuration: "8-months" as LeaseDuration,
  moveInDate: "",
  budgetMin: undefined,
  budgetMax: undefined,
};

// ── Simple chip/option picker ────────────────────────────────────────────────
function OptionPicker<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, value === opt.value && styles.chipActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── 1–5 slider (manual taps) ─────────────────────────────────────────────────
function ScalePicker({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            style={[styles.scaleDot, value >= n && styles.scaleDotActive]}
            onPress={() => onChange(n as Cleanliness)}
          />
        ))}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabelText}>{lowLabel}</Text>
          <Text style={styles.scaleLabelText}>{highLabel}</Text>
        </View>
      )}
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { user, signOut } = useAuth();
  const storageKey = `gryphongrid_profile_${user?.uid ?? "anonymous"}`;
  const defaultProfileForUser: Profile = { ...DEFAULT_PROFILE, id: user?.uid ?? "me" };

  const [profile, setProfile] = useState<Profile>(defaultProfileForUser);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getJSON<Profile>(storageKey, defaultProfileForUser).then((stored) => {
      if (stored.firstName) setProfile(stored);
    });
  }, [storageKey]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await setJSON(storageKey, { ...profile, id: user?.uid ?? "me" });
    setSaved(true);
    setTimeout(() => router.back(), 800);
  }

  const insets = useSafeAreaInsets();

  async function handlePreview() {
    await setJSON(storageKey, { ...profile, id: user?.uid ?? "me" });
    router.push("/profile/me");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Pressable onPress={handlePreview} style={styles.previewBtn}>
          <Text style={styles.previewBtnText}>Preview Profile →</Text>
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>Edit Profile</Text>

      {/* ── Section 1: Identity Basics ────────────────────────────────── */}
      <SectionHeader number="1" title="Identity Basics" subtitle="Keep it minimal." />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>First name *</Text>
        <TextInput
          style={styles.input}
          value={profile.firstName}
          onChangeText={(v) => set("firstName", v)}
          placeholder="Your first name"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Age</Text>
        <TextInput
          style={styles.input}
          value={profile.age?.toString() ?? ""}
          onChangeText={(v) => set("age", v ? parseInt(v, 10) : undefined)}
          placeholder="e.g. 22"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />
      </View>

      <OptionPicker<Gender | "">
        label="Gender (optional)"
        value={profile.gender ?? ""}
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "non-binary", label: "Non-binary" },
          { value: "prefer-not-to-say", label: "Prefer not to say" },
        ]}
        onSelect={(v) => set("gender", (v || undefined) as Gender | undefined)}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Program / Occupation *</Text>
        <TextInput
          style={styles.input}
          value={profile.program}
          onChangeText={(v) => set("program", v)}
          placeholder="e.g. Computer Science, Co-op, Working…"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          Short bio *{" "}
          <Text style={styles.charCount}>({profile.bio.length}/250)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.bio}
          onChangeText={(v) => set("bio", v.slice(0, 250))}
          placeholder="Tell potential roommates about yourself…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Profile photo URL</Text>
        <TextInput
          style={styles.input}
          value={profile.photoUrl ?? ""}
          onChangeText={(v) => set("photoUrl", v)}
          placeholder="https://…"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      {/* ── Section 2: Lifestyle ──────────────────────────────────────── */}
      <SectionHeader number="2" title="Lifestyle" subtitle="These are your actual matching levers." />

      <OptionPicker<SleepSchedule>
        label="Sleep schedule"
        value={profile.sleepSchedule}
        options={[
          { value: "early", label: "🌅 Early sleeper" },
          { value: "normal", label: "🌤 Normal" },
          { value: "night-owl", label: "🌙 Night owl" },
          { value: "shift", label: "🔄 Shift worker" },
        ]}
        onSelect={(v) => set("sleepSchedule", v)}
      />

      <ScalePicker
        label="Your cleanliness level"
        value={profile.cleanliness}
        onChange={(v) => set("cleanliness", v as Cleanliness)}
        lowLabel="1 – Lived-in"
        highLabel="5 – Very neat"
      />
      <ScalePicker
        label="Preferred roommate cleanliness"
        value={profile.prefCleanliness}
        onChange={(v) => set("prefCleanliness", v as Cleanliness)}
        lowLabel="1"
        highLabel="5"
      />

      <ScalePicker
        label="Your social energy"
        value={profile.socialEnergy}
        onChange={(v) => set("socialEnergy", v as SocialEnergy)}
        lowLabel="1 – Very quiet"
        highLabel="5 – Very social"
      />
      <ScalePicker
        label="Preferred roommate social energy"
        value={profile.prefSocialEnergy}
        onChange={(v) => set("prefSocialEnergy", v as SocialEnergy)}
        lowLabel="1"
        highLabel="5"
      />

      <OptionPicker<GuestFrequency>
        label="Guests frequency (your habit)"
        value={profile.guestsFrequency}
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "occasionally", label: "Occasionally" },
          { value: "frequently", label: "Frequently" },
        ]}
        onSelect={(v) => set("guestsFrequency", v)}
      />
      <OptionPicker<GuestFrequency>
        label="Preferred roommate guests"
        value={profile.prefGuestsFrequency}
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "occasionally", label: "Occasionally" },
          { value: "frequently", label: "Frequently" },
        ]}
        onSelect={(v) => set("prefGuestsFrequency", v)}
      />

      <OptionPicker<SubstanceEnv>
        label="Substance environment"
        value={profile.substanceEnv}
        options={[
          { value: "smoke-free", label: "🚭 Smoke-free" },
          { value: "alcohol-ok", label: "🍺 Alcohol OK" },
          { value: "420-friendly", label: "🌿 420 friendly" },
          { value: "no-substances", label: "✅ No substances" },
        ]}
        onSelect={(v) => set("substanceEnv", v)}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Pets</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Has dog</Text>
          <Switch value={profile.hasDog} onValueChange={(v) => set("hasDog", v)} trackColor={{ true: "#7c3aed" }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Has cat</Text>
          <Switch value={profile.hasCat} onValueChange={(v) => set("hasCat", v)} trackColor={{ true: "#7c3aed" }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Open to pets</Text>
          <Switch value={profile.openToPets} onValueChange={(v) => set("openToPets", v)} trackColor={{ true: "#7c3aed" }} />
        </View>
        <OptionPicker<PetAllergy>
          label="Allergies"
          value={profile.petAllergy}
          options={[
            { value: "none", label: "None" },
            { value: "dog", label: "Dog" },
            { value: "cat", label: "Cat" },
            { value: "both", label: "Both" },
          ]}
          onSelect={(v) => set("petAllergy", v)}
        />
      </View>

      <OptionPicker<NoiseTolerance>
        label="Noise tolerance"
        value={profile.noiseTolerance}
        options={[
          { value: "quiet", label: "🤫 Needs quiet" },
          { value: "moderate", label: "🎵 Moderate" },
          { value: "background-ok", label: "🔊 Background OK" },
        ]}
        onSelect={(v) => set("noiseTolerance", v)}
      />

      {/* ── Section 3: Living Intent ──────────────────────────────────── */}
      <SectionHeader number="3" title="Living Intent" subtitle="Important for stability." />

      <OptionPicker<LeaseDuration>
        label="Looking for"
        value={profile.leaseDuration}
        options={[
          { value: "4-months", label: "4 mo" },
          { value: "8-months", label: "8 mo" },
          { value: "12-months", label: "12 mo" },
          { value: "16-months", label: "16 mo" },
          { value: "16-plus", label: "16+ mo" },
          { value: "indefinite", label: "Indefinite" },
        ]}
        onSelect={(v) => set("leaseDuration", v)}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Move-in date</Text>
        <TextInput
          style={styles.input}
          value={profile.moveInDate ?? ""}
          onChangeText={(v) => set("moveInDate", v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Budget range (optional)</Text>
        <View style={styles.budgetRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={profile.budgetMin?.toString() ?? ""}
            onChangeText={(v) => set("budgetMin", v ? parseInt(v, 10) : undefined)}
            placeholder="Min $"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
          <Text style={styles.budgetDash}>–</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={profile.budgetMax?.toString() ?? ""}
            onChangeText={(v) => set("budgetMax", v ? parseInt(v, 10) : undefined)}
            placeholder="Max $"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* ── Save button ───────────────────────────────────────────────── */}
      <Pressable style={[styles.saveBtn, saved && styles.saveBtnDone]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? "✓ Saved!" : "Save Profile"}</Text>
      </Pressable>
      {/* ── Account ──────────────────────────────────────────────── */}
      <View style={styles.accountSection}>
        {user?.email ? (
          <Text style={styles.accountEmail}>Signed in as {user.email}</Text>
        ) : null}
        <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
          <Text style={styles.signOutBtnText}>Sign out</Text>
        </Pressable>
      </View>    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 60 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {},
  backText: { color: "#7c3aed", fontSize: 16, fontWeight: "500" },
  previewBtn: {
    backgroundColor: "#f0edff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  previewBtnText: { color: "#7c3aed", fontSize: 13, fontWeight: "700" },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#111", marginBottom: 20 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c3aed",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
    fontSize: 14,
    fontWeight: "700",
    overflow: "hidden",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  sectionSubtitle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  charCount: { fontWeight: "400", color: "#9ca3af" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 10 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  chipText: { fontSize: 13, color: "#374151" },
  chipTextActive: { color: "#fff", fontWeight: "600" },

  scaleRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  scaleDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  scaleDotActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  scaleLabelText: { fontSize: 11, color: "#9ca3af" },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  switchLabel: { fontSize: 14, color: "#374151" },

  budgetRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetDash: { fontSize: 16, color: "#9ca3af" },

  saveBtn: {
    marginTop: 32,
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    paddingVertical: 16,
  },
  saveBtnDone: { backgroundColor: "#16a34a" },
  saveBtnText: { textAlign: "center", fontSize: 16, fontWeight: "700", color: "#fff" },

  accountSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
    gap: 12,
  },
  accountEmail: {
    fontSize: 13,
    color: "#6b7280",
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  signOutBtnText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 14,
  },
});
