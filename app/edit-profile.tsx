import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
  Modal,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadProfile, saveProfile, uploadProfilePhoto } from "../lib/db";
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

const PURPLE = "#7c3aed";

// ── Calendar date picker (pure React Native, no native modules) ───────────────
const CAL_MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CAL_DAYS         = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePickerField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const now     = new Date();
  const initial = value ? new Date(value + "T12:00:00") : now;
  const [viewYear,  setViewYear]  = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [show, setShow] = useState(false);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day: number) {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setShow(false);
  }

  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const displayValue = value
    ? (() => { const [y, m, d] = value.split("-"); return `${CAL_MONTHS_SHORT[parseInt(m, 10) - 1]} ${d}, ${y}`; })()
    : "Select a date";

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dateBtn} onPress={() => setShow(true)}>
        <Text style={[styles.dateBtnText, !value && styles.datePlaceholder]}>{displayValue}</Text>
        <Text style={styles.dateIcon}>📅</Text>
      </Pressable>
      <Modal visible={show} transparent animationType="slide">
        <View style={styles.dateModalBg}>
          <View style={[styles.dateModal, { paddingBottom: 16 }]}>
            <View style={calStyles.header}>
              <Pressable onPress={() => setShow(false)}>
                <Text style={calStyles.cancel}>Cancel</Text>
              </Pressable>
              <Text style={calStyles.title}>Select Date</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={calStyles.nav}>
              <Pressable onPress={prevMonth} style={calStyles.navBtn}>
                <Text style={calStyles.navArrow}>‹</Text>
              </Pressable>
              <Text style={calStyles.navMonth}>{CAL_MONTHS[viewMonth]} {viewYear}</Text>
              <Pressable onPress={nextMonth} style={calStyles.navBtn}>
                <Text style={calStyles.navArrow}>›</Text>
              </Pressable>
            </View>
            <View style={calStyles.weekRow}>
              {CAL_DAYS.map(d => <Text key={d} style={calStyles.weekDay}>{d}</Text>)}
            </View>
            <View style={calStyles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`b${i}`} style={calStyles.cell} />;
                const cellDate  = new Date(viewYear, viewMonth, day);
                const isPast    = cellDate < today;
                const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr === value;
                const isToday   = cellDate.getTime() === today.getTime();
                return (
                  <Pressable
                    key={dateStr}
                    style={[calStyles.cell, isSelected && calStyles.cellSelected, !isSelected && isToday && calStyles.cellToday]}
                    onPress={() => !isPast && selectDay(day)}
                    disabled={isPast}
                  >
                    <Text style={[calStyles.cellText, isSelected && calStyles.cellTextSelected, isPast && calStyles.cellTextPast]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const calStyles = StyleSheet.create({
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title:            { fontSize: 15, fontWeight: "700", color: "#111827" },
  cancel:           { fontSize: 15, color: "#6b7280", width: 60 },
  nav:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 10 },
  navBtn:           { padding: 10 },
  navArrow:         { fontSize: 24, color: PURPLE, fontWeight: "700", lineHeight: 26 },
  navMonth:         { fontSize: 16, fontWeight: "700", color: "#111827" },
  weekRow:          { flexDirection: "row", paddingHorizontal: 8, marginBottom: 2 },
  weekDay:          { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: "#9ca3af", paddingVertical: 4 },
  grid:             { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  cell:             { width: "14.2857%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 100 },
  cellSelected:     { backgroundColor: PURPLE },
  cellToday:        { borderWidth: 1.5, borderColor: PURPLE },
  cellText:         { fontSize: 14, color: "#111827" },
  cellTextSelected: { color: "#fff", fontWeight: "700" },
  cellTextPast:     { color: "#d1d5db" },
});

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

// ── Profile photo picker ──────────────────────────────────────────────────────
function PhotoPicker({ uid, value, onChange }: { uid: string; value: string; onChange: (uri: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function pick(useCamera: boolean) {
    if (Platform.OS !== "web") {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          "Permission required",
          useCamera ? "Camera access is needed." : "Photo library access is needed.",
        );
        return;
      }
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
    if (!result.canceled && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      try {
        setUploading(true);
        const downloadUrl = await uploadProfilePhoto(uid, localUri);
        onChange(downloadUrl);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("[PhotoPicker] upload error:", e);
        // Alert.alert doesn't render on web — fall back to window.alert
        if (Platform.OS === "web") {
          // eslint-disable-next-line no-alert
          window.alert(`Photo upload failed: ${msg}`);
        } else {
          Alert.alert("Upload failed", msg);
        }
      } finally {
        setUploading(false);
      }
    }
  }

  function prompt() {
    // On web, camera isn't available — go straight to library picker
    if (Platform.OS === "web") {
      pick(false);
      return;
    }
    Alert.alert("Profile Photo", "Choose a source", [
      { text: "Camera", onPress: () => pick(true) },
      { text: "Photo Library", onPress: () => pick(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={[styles.fieldGroup, { alignItems: "center" }]}>
      <Pressable onPress={uploading ? undefined : prompt} style={{ position: "relative" }}>
        {value ? (
          <Image source={{ uri: value }} style={photoPickerStyles.avatar} />
        ) : (
          <View style={[photoPickerStyles.avatar, photoPickerStyles.placeholder]}>
            <Text style={photoPickerStyles.placeholderIcon}>📷</Text>
            <Text style={photoPickerStyles.placeholderSub}>Add photo</Text>
          </View>
        )}
        {uploading ? (
          <View style={[photoPickerStyles.badge, { backgroundColor: "#9ca3af" }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <View style={photoPickerStyles.badge}>
            <Text style={photoPickerStyles.badgeText}>✎</Text>
          </View>
        )}
      </Pressable>
      {!!value && !uploading && (
        <Pressable onPress={() => onChange("")} style={{ marginTop: 8 }}>
          <Text style={photoPickerStyles.remove}>Remove photo</Text>
        </Pressable>
      )}
      {uploading && <Text style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>Uploading…</Text>}
    </View>
  );
}

const photoPickerStyles = StyleSheet.create({
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 28 },
  placeholderSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: PURPLE,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 12 },
  remove: { color: "#ef4444", fontSize: 13 },
});

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
  const defaultProfileForUser: Profile = { ...DEFAULT_PROFILE, id: user?.uid ?? "me" };

  const [profile, setProfile] = useState<Profile>(defaultProfileForUser);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    loadProfile(user.uid).then((stored) => {
      if (stored?.firstName) setProfile(stored);
    });
  }, [user?.uid]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveProfile(user?.uid ?? "me", { ...profile, id: user?.uid ?? "me" });
    setSaved(true);
    setTimeout(() => router.back(), 800);
  }

  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

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

      <PhotoPicker uid={user?.uid ?? "me"} value={profile.photoUrl ?? ""} onChange={(v) => set("photoUrl", v)} />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          Instagram{" "}
          <Text style={styles.charCount}>(optional · only visible after matching)</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>@</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={profile.instagramHandle ?? ""}
            onChangeText={(v) => set("instagramHandle", v.replace(/[^a-zA-Z0-9._]/g, ""))}
            placeholder="your_handle"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
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

      <View style={styles.quizNotice}>
        <Text style={styles.quizNoticeTitle}>🧹 Cleanliness · 🤝 Social energy</Text>
        <Text style={styles.quizNoticeBody}>
          These scores are calculated from your onboarding quiz and cannot be edited here.
          Re-do onboarding if you want to update them.
        </Text>
        <View style={styles.quizScores}>
          <View style={styles.quizScore}>
            <Text style={styles.quizScoreNum}>{profile.cleanliness}/5</Text>
            <Text style={styles.quizScoreLabel}>Cleanliness</Text>
          </View>
          <View style={styles.quizScoreDivider} />
          <View style={styles.quizScore}>
            <Text style={styles.quizScoreNum}>{profile.socialEnergy}/5</Text>
            <Text style={styles.quizScoreLabel}>Social energy</Text>
          </View>
        </View>
      </View>

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

      <DatePickerField
        label="Move-in date"
        value={profile.moveInDate ?? ""}
        onChange={(v) => set("moveInDate", v)}
      />

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
  backBtn: { marginBottom: 8 },
  backText: { color: "#7c3aed", fontSize: 16, fontWeight: "500" },
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

  quizNotice: {
    backgroundColor: "#f0edff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  quizNoticeTitle: { fontSize: 14, fontWeight: "700", color: "#7c3aed" },
  quizNoticeBody: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  quizScores: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12,
  },
  quizScore: { alignItems: "center", gap: 2 },
  quizScoreNum: { fontSize: 20, fontWeight: "800", color: "#7c3aed" },
  quizScoreLabel: { fontSize: 11, color: "#9ca3af" },
  quizScoreDivider: { width: 1, height: 32, backgroundColor: "#ddd6fe" },

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
  // Date picker
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
  },
  dateBtnText: { fontSize: 15, color: "#111827" },
  datePlaceholder: { color: "#9ca3af" },
  dateIcon: { fontSize: 16 },
  dateModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dateModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  dateModalDone: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dateModalDoneText: { color: PURPLE, fontSize: 16, fontWeight: "700" },
});
