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
  Modal,
  FlatList,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import type {} from "../context/AuthContext";
import { saveProfile, saveOnboarded } from "../lib/db";
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
const TOTAL_STEPS = 5;

type StepProps = { p: Profile; set: <K extends keyof Profile>(key: K, val: Profile[K]) => void };
type QuizAnswer = "A" | "B" | "C" | "D" | undefined;

// ── Chip picker ───────────────────────────────────────────────────────────────
function Chips<T extends string>({
  label, options, value, onSelect,
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

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "#e5e7eb", true: PURPLE }} thumbColor="#fff" />
    </View>
  );
}

// ── Accordion quiz question ────────────────────────────────────────────────────
function AccordionQuestion({
  num, question, options, answer, open, onToggle, onSelect, onNext, isLast,
}: {
  num: number;
  question: string;
  options: { value: "A" | "B" | "C" | "D"; label: string }[];
  answer: QuizAnswer;
  open: boolean;
  onToggle: () => void;
  onSelect: (v: QuizAnswer) => void;
  onNext?: () => void;
  isLast?: boolean;
}) {
  const selected = options.find((o) => o.value === answer);
  return (
    <View style={[styles.accordion, open && styles.accordionOpen]}>
      <Pressable style={styles.accordionHeader} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.accordionNum}>Question {num}</Text>
          <Text style={styles.accordionQ} numberOfLines={open ? undefined : 2}>{question}</Text>
          {!open && selected && (
            <Text style={styles.accordionSelected}>✓ {selected.label}</Text>
          )}
        </View>
        <Text style={styles.accordionChevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open && (
        <View style={styles.accordionBody}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.optionRow, answer === opt.value && styles.optionRowActive]}
              onPress={() => onSelect(opt.value)}
            >
              <View style={[styles.optionCircle, answer === opt.value && styles.optionCircleActive]}>
                <Text style={[styles.optionCircleText, answer === opt.value && styles.optionCircleTextActive]}>
                  {opt.value}
                </Text>
              </View>
              <Text style={[styles.optionText, answer === opt.value && styles.optionTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          {!!answer && onNext && (
            <Pressable style={styles.accordionNextBtn} onPress={onNext}>
              <Text style={styles.accordionNextText}>{isLast ? "Done ✓" : "Next →"}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ── Date picker field (pure JS, no native module) ────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const YEARS  = Array.from({ length: 6  }, (_, i) => String(new Date().getFullYear() + i));

function DatePickerField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const now   = new Date();
  const parts = value ? value.split("-") : [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")];
  const [year,  setYear]  = useState(parts[0]);
  const [month, setMonth] = useState(parts[1]);
  const [day,   setDay]   = useState(parts[2]);
  const [show,  setShow]  = useState(false);

  function confirm() {
    onChange(`${year}-${month}-${day}`);
    setShow(false);
  }

  function ColPicker({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
    return (
      <FlatList
        data={items}
        keyExtractor={(x) => x}
        style={{ height: 180 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[dpStyles.colItem, item === selected && dpStyles.colItemActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[dpStyles.colText, item === selected && dpStyles.colTextActive]}>{item}</Text>
          </Pressable>
        )}
      />
    );
  }

  const displayMonth = MONTHS[parseInt(month, 10) - 1] ?? month;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dateBtn} onPress={() => setShow(true)}>
        <Text style={[styles.dateBtnText, !value && styles.datePlaceholder]}>
          {value ? `${displayMonth} ${day}, ${year}` : "Select a date"}
        </Text>
        <Text style={styles.dateIcon}>📅</Text>
      </Pressable>
      <Modal visible={show} transparent animationType="slide">
        <View style={styles.dateModalBg}>
          <View style={styles.dateModal}>
            <View style={dpStyles.header}>
              <Pressable onPress={() => setShow(false)}>
                <Text style={dpStyles.cancel}>Cancel</Text>
              </Pressable>
              <Text style={dpStyles.title}>Select Date</Text>
              <Pressable onPress={confirm}>
                <Text style={dpStyles.done}>Done</Text>
              </Pressable>
            </View>
            <View style={dpStyles.cols}>
              <View style={dpStyles.col}>
                <Text style={dpStyles.colLabel}>Month</Text>
                <ColPicker
                  items={MONTHS.map((_, i) => String(i + 1).padStart(2, "0"))}
                  selected={month}
                  onSelect={setMonth}
                />
              </View>
              <View style={dpStyles.col}>
                <Text style={dpStyles.colLabel}>Day</Text>
                <ColPicker items={DAYS} selected={day} onSelect={setDay} />
              </View>
              <View style={dpStyles.col}>
                <Text style={dpStyles.colLabel}>Year</Text>
                <ColPicker items={YEARS} selected={year} onSelect={setYear} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title:  { fontSize: 15, fontWeight: "700", color: "#111827" },
  cancel: { fontSize: 15, color: "#6b7280" },
  done:   { fontSize: 15, color: PURPLE, fontWeight: "700" },
  cols:   { flexDirection: "row", paddingHorizontal: 8, paddingBottom: 32 },
  col:    { flex: 1, alignItems: "center" },
  colLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 10, marginBottom: 4 },
  colItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginVertical: 1, width: "100%", alignItems: "center" },
  colItemActive: { backgroundColor: PURPLE },
  colText: { fontSize: 15, color: "#374151" },
  colTextActive: { color: "#fff", fontWeight: "700" },
});

// ── Step heading ──────────────────────────────────────────────────────────────
function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.stepHeading}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Scoring helpers ───────────────────────────────────────────────────────────
const CLEAN_MAP: Record<string, number>  = { A: 5, B: 4, C: 3, D: 1 };
const CLEAN_MAP2: Record<string, number> = { A: 5, B: 4, C: 3, D: 2 };
const SOCIAL_MAP: Record<string, number>  = { A: 1, B: 2, C: 4, D: 5 };
const SOCIAL_MAP3: Record<string, number> = { A: 1, B: 2, C: 3, D: 5 };

function avg3(
  a: QuizAnswer, b: QuizAnswer, c: QuizAnswer,
  m1: Record<string, number>, m2: Record<string, number>, m3: Record<string, number>,
): Cleanliness {
  const vals = [(a ? (m1[a] ?? 3) : 3), (b ? (m2[b] ?? 3) : 3), (c ? (m3[c] ?? 3) : 3)];
  return Math.round(vals.reduce((x, y) => x + y, 0) / 3) as Cleanliness;
}

function substanceFrom(a?: string): SubstanceEnv {
  if (a === "A") return "no-substances";
  if (a === "B") return "smoke-free";
  if (a === "C") return "alcohol-ok";
  return "420-friendly";
}

function noiseFrom(a?: string): NoiseTolerance {
  if (a === "A" || a === "B") return "quiet";
  if (a === "C") return "moderate";
  return "background-ok";
}

function guestsFrom(a?: string): GuestFrequency {
  if (a === "A" || a === "B") return "rarely";
  if (a === "C") return "occasionally";
  return "frequently";
}

// ── Onboarding photo picker ───────────────────────────────────────────────────
function OnboardingPhotoPicker({ value, onChange }: { value: string; onChange: (uri: string) => void }) {
  async function pick(useCamera: boolean) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission required", useCamera ? "Camera access is needed." : "Photo library access is needed.");
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) onChange(result.assets[0].uri);
  }

  function prompt() {
    Alert.alert("Profile Photo", "Choose a source", [
      { text: "Camera", onPress: () => pick(true) },
      { text: "Photo Library", onPress: () => pick(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={obPhotoStyles.wrap}>
      <Pressable onPress={prompt} style={{ position: "relative" }}>
        {value ? (
          <Image source={{ uri: value }} style={obPhotoStyles.avatar} />
        ) : (
          <View style={[obPhotoStyles.avatar, obPhotoStyles.placeholder]}>
            <Text style={obPhotoStyles.icon}>📷</Text>
            <Text style={obPhotoStyles.hint}>Add photo</Text>
          </View>
        )}
        <View style={obPhotoStyles.badge}>
          <Text style={obPhotoStyles.badgeText}>✎</Text>
        </View>
      </Pressable>
      <Text style={obPhotoStyles.caption}>Profile photo{value ? "" : " (optional)"}</Text>
      {!!value && (
        <Pressable onPress={() => onChange("")}>
          <Text style={obPhotoStyles.remove}>Remove</Text>
        </Pressable>
      )}
    </View>
  );
}

const obPhotoStyles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 20, gap: 6 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 28 },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
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
  caption: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  remove: { fontSize: 12, color: "#ef4444" },
});

// ── Step 0: Identity + basics ─────────────────────────────────────────────────
function Step0({ p, set }: StepProps) {
  return (
    <>
      <StepHeading title="About you" subtitle="Let's start with the basics." />
      <OnboardingPhotoPicker value={p.photoUrl ?? ""} onChange={(v) => set("photoUrl", v)} />
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
          placeholder="A short intro — hobbies, lifestyle, anything a roommate should know…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Instagram <Text style={styles.charCount}>(optional · only shared after matching)</Text></Text>
        <View style={styles.igRow}>
          <Text style={styles.igAt}>@</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={p.instagramHandle ?? ""}
            onChangeText={(v) => set("instagramHandle", v.replace(/[^a-zA-Z0-9._]/g, ""))}
            placeholder="your_handle"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
    </>
  );
}

// ── Step 1: Hard facts ────────────────────────────────────────────────────────
function Step1({ p, set }: StepProps) {
  return (
    <>
      <StepHeading title="The facts" subtitle="Hard details that shape compatibility." />
      <Chips<SleepSchedule>
        label="Sleep schedule"
        options={[
          { value: "early", label: "🌅 Early riser" },
          { value: "normal", label: "🌤 Normal" },
          { value: "night-owl", label: "🌙 Night owl" },
          { value: "shift", label: "🔄 Shift worker" },
        ]}
        value={p.sleepSchedule}
        onSelect={(v) => set("sleepSchedule", v)}
      />
      <Chips<"none" | "dog" | "cat" | "both">
        label="Pets I own"
        options={[
          { value: "none", label: "No pets 🚫" },
          { value: "dog", label: "Dog 🐶" },
          { value: "cat", label: "Cat 🐱" },
          { value: "both", label: "Both 🐶🐱" },
        ]}
        value={p.hasDog && p.hasCat ? "both" : p.hasDog ? "dog" : p.hasCat ? "cat" : "none"}
        onSelect={(v) => {
          set("hasDog", v === "dog" || v === "both");
          set("hasCat", v === "cat" || v === "both");
        }}
      />
      <View style={styles.toggleGroup}>
        <ToggleRow label="Open to living with pets" value={p.openToPets} onChange={(v) => set("openToPets", v)} />
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
      <Chips<GuestFrequency>
        label="How often do you have guests?"
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "occasionally", label: "Occasionally" },
          { value: "frequently", label: "Frequently" },
        ]}
        value={p.guestsFrequency}
        onSelect={(v) => { set("guestsFrequency", v); set("prefGuestsFrequency", v); }}
      />
      <Chips<LeaseDuration>
        label="Lease duration"
        options={[
          { value: "4-months", label: "4 mo" },
          { value: "8-months", label: "8 mo" },
          { value: "12-months", label: "12 mo" },
          { value: "16-months", label: "16 mo" },
          { value: "16-plus", label: "16+ mo" },
          { value: "indefinite", label: "Indefinite" },
        ]}
        value={p.leaseDuration}
        onSelect={(v) => set("leaseDuration", v)}
      />
      <DatePickerField
        label="Desired move-in date"
        value={p.moveInDate ?? ""}
        onChange={(v) => set("moveInDate", v)}
      />
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

// ── Step 2: Cleanliness quiz ──────────────────────────────────────────────────
function Step2({
  openQ, setOpenQ, answers, setAnswer,
}: {
  openQ: number | null;
  setOpenQ: (q: number | null) => void;
  answers: QuizAnswer[];
  setAnswer: (i: number, a: QuizAnswer) => void;
}) {
  function toggle(i: number) { setOpenQ(openQ === i ? null : i); }
  function pick(i: number, v: QuizAnswer) { setAnswer(i, v); }
  function next(i: number) { setOpenQ(i + 1 < 3 ? i + 1 : null); }
  return (
    <>
      <StepHeading
        title="Your home habits"
        subtitle="These questions help us determine your cleanliness level. Please answer honestly."
      />
      <AccordionQuestion
        num={1}
        question="Which best describes your relationship with smoking, vaping, or alcohol in the home?"
        options={[
          { value: "A", label: "Strictly substance-free — no smoking, vaping, or alcohol anywhere on the property." },
          { value: "B", label: "Alcohol is fine, but I need a 100% smoke/vape-free home — smells really affect me." },
          { value: "C", label: "Fine with social drinking and outside-only smoking or vaping." },
          { value: "D", label: "Comfortable with social drinking and occasional indoor vaping or cannabis use." },
        ]}
        answer={answers[0]} open={openQ === 0} onToggle={() => toggle(0)} onSelect={(v) => pick(0, v)}
        onNext={() => next(0)}
      />
      <AccordionQuestion
        num={2}
        question="A roommate's pet leaves hair on the couch or has an occasional accident. What's your take?"
        options={[
          { value: "A", label: "Deal-breaker — I have allergies or a very low tolerance for pet messes and smells." },
          { value: "B", label: "I like animals, but they must stay off shared furniture and out of my room." },
          { value: "C", label: "I love pets and don't mind some hair, as long as the owner cleans up messes right away." },
          { value: "D", label: "Pet parent at heart — I'll probably end up helping care for any pet in the house." },
        ]}
        answer={answers[1]} open={openQ === 1} onToggle={() => toggle(1)} onSelect={(v) => pick(1, v)}
        onNext={() => next(1)}
      />
      <AccordionQuestion
        num={3}
        question="How much physical space does your favourite hobby take up in the house?"
        options={[
          { value: "A", label: "Zero footprint — my hobbies are digital or happen entirely outside the home." },
          { value: "B", label: "Small footprint — one bin or a small desk setup for crafts or supplies." },
          { value: "C", label: "Moderate footprint — a bike, instrument, or larger equipment needing a corner." },
          { value: "D", label: "Large footprint — camping gear, multiple bikes, or studio supplies needing extra storage." },
        ]}
        answer={answers[2]} open={openQ === 2} onToggle={() => toggle(2)} onSelect={(v) => pick(2, v)}
        onNext={() => next(2)} isLast
      />
    </>
  );
}

// ── Step 3: Social energy quiz ────────────────────────────────────────────────
function Step3({
  openQ, setOpenQ, answers, setAnswer,
}: {
  openQ: number | null;
  setOpenQ: (q: number | null) => void;
  answers: QuizAnswer[];
  setAnswer: (i: number, a: QuizAnswer) => void;
}) {
  function toggle(i: number) { setOpenQ(openQ === i ? null : i); }
  function pick(i: number, v: QuizAnswer) { setAnswer(i, v); }
  function next(i: number) { setOpenQ(i + 1 < 3 ? i + 1 : null); }
  return (
    <>
      <StepHeading
        title="Your social side"
        subtitle="These questions help us determine your social energy level. Be honest — there's no wrong answer."
      />
      <AccordionQuestion
        num={1}
        question="It's 6:00 PM on a Tuesday after a long day. Where are you?"
        options={[
          { value: "A", label: "In my room with the door closed — I need total solitude to recharge." },
          { value: "B", label: "Happy to chat briefly while making food, then heading to my own space." },
          { value: "C", label: "In the common area, hoping my roommate is around to vent or watch something." },
          { value: "D", label: "Rarely home — I usually stay out with friends until I'm ready to sleep." },
        ]}
        answer={answers[0]} open={openQ === 0} onToggle={() => toggle(0)} onSelect={(v) => pick(0, v)}
        onNext={() => next(0)}
      />
      <AccordionQuestion
        num={2}
        question="How do you feel about unannounced visitors or frequent guests?"
        options={[
          { value: "A", label: "My home is private — I prefer 24-hour notice before any guest comes over." },
          { value: "B", label: "Occasional guests are fine, but max 1–2 nights a week with a quick heads-up." },
          { value: "C", label: "Very social — comfortable with friends dropping by anytime in the common areas." },
          { value: "D", label: "Love hosting — I'd like small gatherings or dinner parties 3+ times a week." },
        ]}
        answer={answers[1]} open={openQ === 1} onToggle={() => toggle(1)} onSelect={(v) => pick(1, v)}
        onNext={() => next(1)}
      />
      <AccordionQuestion
        num={3}
        question="What is the 'soundtrack' of your home life?"
        options={[
          { value: "A", label: "Library quiet — I use headphones for everything and expect near-silence." },
          { value: "B", label: "Low background — a TV at low volume or quiet music is fine, but no loud bass." },
          { value: "C", label: "Normal activity — cooking sounds, talking, and music are all fine." },
          { value: "D", label: "High energy — I usually have music or TV going at all times." },
        ]}
        answer={answers[2]} open={openQ === 2} onToggle={() => toggle(2)} onSelect={(v) => pick(2, v)}
        onNext={() => next(2)} isLast
      />
    </>
  );
}

// ── Step 4: Review ────────────────────────────────────────────────────────────
function Step4({ p, cleanScore, socialScore }: { p: Profile; cleanScore: Cleanliness; socialScore: SocialEnergy }) {
  const cleanLabel  = ["", "Very relaxed", "Relaxed", "Moderate", "Tidy", "Spotless"][cleanScore];
  const socialLabel = ["", "Very introverted", "Introverted", "Balanced", "Social", "Very social"][socialScore];
  return (
    <>
      <StepHeading title="Review & save" subtitle="Here's what we've got. Tap Finish to save your profile!" />
      <View style={styles.reviewCard}>
        <Text style={styles.reviewName}>{p.firstName || "—"}{p.age ? `, ${p.age}` : ""}</Text>
        {!!p.program && <Text style={styles.reviewSub}>{p.program}</Text>}
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Lease</Text>
        <Text style={styles.reviewValue}>{p.leaseDuration ?? "—"}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Sleep</Text>
        <Text style={styles.reviewValue}>{p.sleepSchedule ?? "—"}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Pets</Text>
        <Text style={styles.reviewValue}>
          {[p.hasDog && "Dog 🐶", p.hasCat && "Cat 🐱"].filter(Boolean).join(", ") || "None"}
        </Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Budget</Text>
        <Text style={styles.reviewValue}>
          {p.budgetMin || p.budgetMax
            ? `$${p.budgetMin ?? "?"} – $${p.budgetMax ?? "?"}/mo`
            : "Not set"}
        </Text>
      </View>
      <View style={styles.scoreBanner}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreEmoji}>🧹</Text>
          <Text style={styles.scoreValue}>{cleanScore}/5</Text>
          <Text style={styles.scoreDesc}>{cleanLabel}</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreEmoji}>🤝</Text>
          <Text style={styles.scoreValue}>{socialScore}/5</Text>
          <Text style={styles.scoreDesc}>{socialLabel}</Text>
        </View>
      </View>
      <Text style={styles.reviewNote}>
        Your cleanliness and social energy scores are calculated from your quiz answers and used to find compatible roommates.
      </Text>
    </>
  );
}

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
  const { user, signOut, markOnboardingDone } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Profile>({
    id: user?.uid ?? "me",
    firstName: user?.displayName?.split(" ")[0] ?? "",
    ...DEFAULTS,
  });

  const [cleanOpenQ, setCleanOpenQ]   = useState<number | null>(0);
  const [socialOpenQ, setSocialOpenQ] = useState<number | null>(0);
  const [cleanAnswers, setCleanAnswers] = useState<QuizAnswer[]>([undefined, undefined, undefined]);
  const [socialAnswers, setSocialAnswers] = useState<QuizAnswer[]>([undefined, undefined, undefined]);

  function set<K extends keyof Profile>(key: K, val: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: val }));
  }
  function setCleanAnswer(i: number, v: QuizAnswer) {
    setCleanAnswers((prev) => { const n = [...prev]; n[i] = v; return n; });
  }
  function setSocialAnswer(i: number, v: QuizAnswer) {
    setSocialAnswers((prev) => { const n = [...prev]; n[i] = v; return n; });
  }

  const cleanScore  = avg3(cleanAnswers[0],  cleanAnswers[1],  cleanAnswers[2],  CLEAN_MAP, CLEAN_MAP2, CLEAN_MAP);
  const socialScore = avg3(socialAnswers[0], socialAnswers[1], socialAnswers[2], SOCIAL_MAP, SOCIAL_MAP, SOCIAL_MAP3);

  function validateStep(): string | null {
    if (step === 0 && !profile.firstName.trim()) return "Please enter your first name.";
    if (step === 0 && !profile.program.trim())   return "Please enter your program.";
    if (step === 2 && cleanAnswers.some((a) => !a))  return "Please answer all 3 questions.";
    if (step === 3 && socialAnswers.some((a) => !a)) return "Please answer all 3 questions.";
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    setError("");
    setSaving(true);
    try {
      const uid = user?.uid;
      if (!uid) {
        setError("Not logged in – please restart the app and sign in again.");
        setSaving(false);
        return;
      }
      console.log("[onboarding] saving profile for uid:", uid);
      const finalProfile: Profile = {
        ...profile,
        id: uid,
        cleanliness:      cleanScore,
        prefCleanliness:  cleanScore,
        socialEnergy:     socialScore,
        prefSocialEnergy: socialScore,
        substanceEnv:     substanceFrom(cleanAnswers[0]),
        noiseTolerance:   noiseFrom(socialAnswers[2]),
        guestsFrequency:  guestsFrom(socialAnswers[1]),
        prefGuestsFrequency: guestsFrom(socialAnswers[1]),
      };
      console.log("[onboarding] writing profile...");
      await saveProfile(uid, finalProfile);
      console.log("[onboarding] profile saved, writing onboarded flag...");
      await saveOnboarded(uid);
      console.log("[onboarding] all writes done, navigating...");
      markOnboardingDone();
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Save failed: ${msg}`);
      console.error("[onboarding] save error:", e);
      Alert.alert("Firebase Error", msg);
    } finally {
      setSaving(false);
    }
  }

  const progress = (step + 1) / TOTAL_STEPS;
  const isLast   = step === TOTAL_STEPS - 1;

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
        <View style={styles.header}>
          <Text style={styles.logo}>🦅 GryphonGrid</Text>
          <Text style={styles.tagline}>Set up your profile</Text>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>

        <View style={styles.card}>
          {step === 0 && <Step0 p={profile} set={set} />}
          {step === 1 && <Step1 p={profile} set={set} />}
          {step === 2 && (
            <Step2
              openQ={cleanOpenQ} setOpenQ={setCleanOpenQ}
              answers={cleanAnswers} setAnswer={setCleanAnswer}
            />
          )}
          {step === 3 && (
            <Step3
              openQ={socialOpenQ} setOpenQ={setSocialOpenQ}
              answers={socialAnswers} setAnswer={setSocialAnswer}
            />
          )}
          {step === 4 && <Step4 p={profile} cleanScore={cleanScore} socialScore={socialScore} />}

          {!!error && <Text style={styles.error}>{error}</Text>}

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
  header: { alignItems: "center", marginBottom: 20 },
  logo: { fontSize: 28, fontWeight: "800", color: PURPLE },
  tagline: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  progressBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginBottom: 6, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: PURPLE, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: "#9ca3af", textAlign: "right", marginBottom: 16 },
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
  stepHeading: { marginBottom: 24 },
  stepTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  stepSubtitle: { fontSize: 14, color: "#6b7280" },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  charCount: { fontWeight: "400", color: "#9ca3af" },
  igRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  igAt: { fontSize: 16, fontWeight: "600", color: "#6b7280", paddingBottom: 2 },
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
  textArea: { height: 110, paddingTop: 12, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  chipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
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
  budgetRow: { flexDirection: "row" },
  // Accordion
  accordion: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
    overflow: "hidden",
  },
  accordionOpen: { borderColor: PURPLE },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  accordionNum: {
    fontSize: 11,
    fontWeight: "700",
    color: PURPLE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  accordionQ: { fontSize: 14, color: "#111827", fontWeight: "600", lineHeight: 20 },
  accordionSelected: { fontSize: 13, color: PURPLE, fontWeight: "500", marginTop: 6 },
  accordionChevron: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  accordionNextBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  accordionNextText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  accordionBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 10,
  },
  optionRowActive: { borderColor: PURPLE, backgroundColor: "#f5f0ff" },
  optionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCircleActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  optionCircleText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  optionCircleTextActive: { color: "#fff" },
  optionText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
  optionTextActive: { color: "#111827", fontWeight: "500" },
  // Review
  reviewCard: {
    backgroundColor: "#f5f0ff",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  reviewName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  reviewSub: { fontSize: 14, color: PURPLE, fontWeight: "600", marginTop: 2 },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  reviewLabel: { fontSize: 13, color: "#6b7280" },
  reviewValue: { fontSize: 13, color: "#111827", fontWeight: "500" },
  scoreBanner: {
    flexDirection: "row",
    backgroundColor: "#f5f0ff",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  scoreItem: { flex: 1, alignItems: "center", gap: 4 },
  scoreEmoji: { fontSize: 24 },
  scoreValue: { fontSize: 22, fontWeight: "800", color: PURPLE },
  scoreDesc: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  scoreDivider: { width: 1, height: 50, backgroundColor: "#ddd6fe", marginHorizontal: 12 },
  reviewNote: { fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 17 },
  // Nav
  error: {
    color: "#dc2626",
    fontSize: 13,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  btnBack: { paddingVertical: 12, paddingHorizontal: 4 },
  btnBackText: { color: PURPLE, fontSize: 15, fontWeight: "600" },
  btnNext: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  btnNextText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
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
