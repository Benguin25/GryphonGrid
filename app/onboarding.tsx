import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { setJSON } from "../lib/storage";
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
} from "../lib/types";

const PURPLE = "#7c3aed";
const TOTAL_STEPS = 6;

// ── Reusable chip picker ──────────────────────────────────────────────────────
function Chips<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
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

// ── 1-5 dot scale ─────────────────────────────────────────────────────────────
function Scale({
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
    <View style={styles.field}>
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

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#e5e7eb", true: PURPLE }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Step content components ───────────────────────────────────────────────────

function Step0({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={1} title="About you" subtitle="Let's start with the basics." />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>First name *</Text>
        <TextInput
          style={styles.input}
          value={p.firstName}
          onChangeText={(v) => set("firstName", v)}
          placeholder="Your first name"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Age</Text>
        <TextInput
          style={styles.input}
          value={p.age?.toString() ?? ""}
          onChangeText={(v) => set("age", v ? parseInt(v, 10) : undefined)}
          placeholder="e.g. 22"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
      </View>

      <Chips<Gender>
        label="Gender"
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "non-binary", label: "Non-binary" },
          { value: "prefer-not-to-say", label: "Prefer not to say" },
        ]}
        value={p.gender}
        onSelect={(v) => set("gender", v)}
      />
    </>
  );
}

function Step1({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={2} title="Your studies" subtitle="Tell potential roommates what you're about." />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Program / major *</Text>
        <TextInput
          style={styles.input}
          value={p.program}
          onChangeText={(v) => set("program", v)}
          placeholder="e.g. Computer Science"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Bio <Text style={styles.charCount}>({(p.bio ?? "").length}/250)</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={p.bio}
          onChangeText={(v) => set("bio", v.slice(0, 250))}
          placeholder="A short intro — hobbies, lifestyle, anything you'd want a roommate to know…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
    </>
  );
}

function Step2({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={3} title="Sleep & cleanliness" subtitle="Help us find someone compatible with your daily rhythm." />

      <Chips<SleepSchedule>
        label="Your sleep schedule"
        options={[
          { value: "early", label: "🌅 Early riser" },
          { value: "normal", label: "🌤 Normal" },
          { value: "night-owl", label: "🌙 Night owl" },
          { value: "shift", label: "🔄 Shift worker" },
        ]}
        value={p.sleepSchedule}
        onSelect={(v) => set("sleepSchedule", v)}
      />

      <Scale
        label="Your cleanliness"
        value={p.cleanliness}
        onChange={(v) => set("cleanliness", v as Cleanliness)}
        lowLabel="Relaxed"
        highLabel="Spotless"
      />

      <Scale
        label="Preferred roommate cleanliness"
        value={p.prefCleanliness}
        onChange={(v) => set("prefCleanliness", v as Cleanliness)}
        lowLabel="Relaxed"
        highLabel="Spotless"
      />

      <Chips<NoiseTolerance>
        label="Noise tolerance"
        options={[
          { value: "quiet", label: "🤫 Need quiet" },
          { value: "moderate", label: "🎵 Moderate" },
          { value: "background-ok", label: "🔊 Background OK" },
        ]}
        value={p.noiseTolerance}
        onSelect={(v) => set("noiseTolerance", v)}
      />
    </>
  );
}

function Step3({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={4} title="Social life" subtitle="How social are you at home?" />

      <Scale
        label="Your social energy"
        value={p.socialEnergy}
        onChange={(v) => set("socialEnergy", v as SocialEnergy)}
        lowLabel="Introvert"
        highLabel="Social butterfly"
      />

      <Scale
        label="Preferred roommate social energy"
        value={p.prefSocialEnergy}
        onChange={(v) => set("prefSocialEnergy", v as SocialEnergy)}
        lowLabel="Introvert"
        highLabel="Social butterfly"
      />

      <Chips<GuestFrequency>
        label="How often do you have guests?"
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "occasionally", label: "Occasionally" },
          { value: "frequently", label: "Frequently" },
        ]}
        value={p.guestsFrequency}
        onSelect={(v) => set("guestsFrequency", v)}
      />

      <Chips<GuestFrequency>
        label="Preferred roommate guests frequency"
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "occasionally", label: "Occasionally" },
          { value: "frequently", label: "Frequently" },
        ]}
        value={p.prefGuestsFrequency}
        onSelect={(v) => set("prefGuestsFrequency", v)}
      />
    </>
  );
}

function Step4({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={5} title="Pets & atmosphere" subtitle="Let's make sure everyone's comfortable." />

      <Chips<SubstanceEnv>
        label="Substance environment"
        options={[
          { value: "no-substances", label: "✅ No substances" },
          { value: "smoke-free", label: "🚭 Smoke-free" },
          { value: "alcohol-ok", label: "🍺 Alcohol OK" },
          { value: "420-friendly", label: "🌿 420 friendly" },
        ]}
        value={p.substanceEnv}
        onSelect={(v) => set("substanceEnv", v)}
      />

      <View style={styles.toggleGroup}>
        <ToggleRow label="I have a dog 🐶" value={p.hasDog} onChange={(v) => set("hasDog", v)} />
        <ToggleRow label="I have a cat 🐱" value={p.hasCat} onChange={(v) => set("hasCat", v)} />
        <ToggleRow label="Open to pets" value={p.openToPets} onChange={(v) => set("openToPets", v)} />
      </View>

      <Chips<"none" | "dog" | "cat" | "both">
        label="Pet allergies"
        options={[
          { value: "none", label: "None" },
          { value: "dog", label: "Dog" },
          { value: "cat", label: "Cat" },
          { value: "both", label: "Both" },
        ]}
        value={p.petAllergy}
        onSelect={(v) => set("petAllergy", v)}
      />
    </>
  );
}

function Step5({ p, set }: StepProps) {
  return (
    <>
      <StepHeading step={6} title="Living plans" subtitle="Nearly done — just your living intentions." />

      <Chips<LeaseDuration>
        label="Lease duration"
        options={[
          { value: "4-months", label: "4 months" },
          { value: "8-months", label: "8 months" },
          { value: "12-plus", label: "12+ months" },
        ]}
        value={p.leaseDuration}
        onSelect={(v) => set("leaseDuration", v)}
      />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Desired move-in date</Text>
        <TextInput
          style={styles.input}
          value={p.moveInDate ?? ""}
          onChangeText={(v) => set("moveInDate", v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View style={styles.budgetRow}>
        <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.fieldLabel}>Budget min ($/mo)</Text>
          <TextInput
            style={styles.input}
            value={p.budgetMin?.toString() ?? ""}
            onChangeText={(v) => set("budgetMin", v ? parseInt(v, 10) : undefined)}
            placeholder="e.g. 600"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.fieldLabel}>Budget max ($/mo)</Text>
          <TextInput
            style={styles.input}
            value={p.budgetMax?.toString() ?? ""}
            onChangeText={(v) => set("budgetMax", v ? parseInt(v, 10) : undefined)}
            placeholder="e.g. 1100"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
      </View>
    </>
  );
}

// ── Step heading component ────────────────────────────────────────────────────
function StepHeading({ title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <View style={styles.stepHeading}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type StepProps = { p: Profile; set: <K extends keyof Profile>(key: K, val: Profile[K]) => void };

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULTS: Omit<Profile, "id" | "firstName"> = {
  bio: "",
  program: "",
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
  leaseDuration: "8-months",
  moveInDate: "",
};

// ── Main onboarding screen ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Profile>({
    id: user?.uid ?? "me",
    firstName: user?.displayName?.split(" ")[0] ?? "",
    ...DEFAULTS,
  });

  function set<K extends keyof Profile>(key: K, val: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: val }));
  }

  function validateStep(): string | null {
    if (step === 0 && !profile.firstName.trim()) return "Please enter your first name.";
    if (step === 1 && !profile.program.trim()) return "Please enter your program.";
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);
    try {
      const uid = user?.uid ?? "me";
      await setJSON(`gryphongrid_profile_${uid}`, { ...profile, id: uid });
      await setJSON(`gryphongrid_onboarded_${uid}`, true);
      router.replace("/(tabs)");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const progress = (step + 1) / TOTAL_STEPS;
  const isLast = step === TOTAL_STEPS - 1;

  const STEPS = [
    <Step0 p={profile} set={set} />,
    <Step1 p={profile} set={set} />,
    <Step2 p={profile} set={set} />,
    <Step3 p={profile} set={set} />,
    <Step4 p={profile} set={set} />,
    <Step5 p={profile} set={set} />,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f7" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🦅 GryphonGrid</Text>
          <Text style={styles.tagline}>Set up your profile</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>

        {/* Card */}
        <View style={styles.card}>
          {STEPS[step]}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <Pressable style={styles.btnBack} onPress={() => { setError(""); setStep((s) => s - 1); }}>
                <Text style={styles.btnBackText}>← Back</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.btnBack} onPress={signOut}>
                <Text style={styles.btnBackText}>← Sign out</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.btnNext, saving && styles.btnDisabled]}
              onPress={isLast ? handleFinish : handleNext}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnNextText}>{isLast ? "Finish 🎉" : "Next →"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f7",
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 36,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: PURPLE,
  },
  tagline: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  progressBg: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: PURPLE,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  stepHeading: {
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 11,
    color: PURPLE,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  charCount: {
    fontWeight: "400",
    color: "#9ca3af",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  chipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  chipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  scaleRow: {
    flexDirection: "row",
    gap: 10,
  },
  scaleDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  scaleDotActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  scaleLabelText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  toggleGroup: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    marginBottom: 20,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  budgetRow: {
    flexDirection: "row",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  btnBack: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  btnBackText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "600",
  },
  btnNext: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  btnNextText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
