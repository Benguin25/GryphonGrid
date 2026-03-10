import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { saveProfile, saveOnboarded, uploadProfilePhoto } from "../lib/db";
import {
  Profile,
  SubstanceEnv,
  LeaseDuration,
  Gender,
  PetAllergy,
  SurveyScore,
  SurveyScores,
  CategoryKey,
} from "../lib/types";
import { deriveSurveyDisplayFields, PRIORITY_MULTIPLIERS, ALL_CATEGORIES } from "../lib/mock";

const RED = "#CC0000";
const TOTAL_STEPS = 5;

// ── Supporting data ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  cleanliness:   "Cleanliness 🧹",
  socialEnergy:  "Social Energy 🗣️",
  sleepSchedule: "Sleep Schedule 🌙",
  guests:        "Guests & Friends 🎉",
  lifestyle:     "Lifestyle 🏡",
};

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Prefer not to say", value: "prefer-not-to-say" },
];

const SUBSTANCE_OPTIONS: { label: string; value: SubstanceEnv }[] = [
  { label: "Smoke-free", value: "smoke-free" },
  { label: "Alcohol OK", value: "alcohol-ok" },
  { label: "420-friendly", value: "420-friendly" },
  { label: "No substances", value: "no-substances" },
];

const LEASE_OPTIONS: { label: string; value: LeaseDuration }[] = [
  { label: "4 months", value: "4-months" },
  { label: "8 months", value: "8-months" },
  { label: "12 months", value: "12-months" },
  { label: "16 months", value: "16-months" },
  { label: "16+ months", value: "16-plus" },
  { label: "Indefinite", value: "indefinite" },
];

const PET_ALLERGY_OPTIONS: { label: string; value: PetAllergy }[] = [
  { label: "None", value: "none" },
  { label: "Dogs", value: "dog" },
  { label: "Cats", value: "cat" },
  { label: "Both", value: "both" },
];

const HOBBIES_LIST: string[] = [
  "Running", "Cycling", "Yoga", "Gym / Weightlifting", "Swimming",
  "Rock Climbing", "Hiking", "Basketball", "Soccer", "Volleyball",
  "Painting", "Photography", "Drawing", "Playing Music", "Singing",
  "Dancing", "Writing", "Filmmaking", "Pottery", "Cooking",
  "Baking", "Gaming", "Board Games", "Reading", "Travel",
  "Volunteering", "Coffee Enthusiast", "Wine / Beer Tasting",
  "Camping", "Skiing / Snowboarding", "Fishing", "Birdwatching",
  "Gardening", "Skateboarding", "Coding", "Chess", "Podcasts",
  "Meditation", "Language Learning", "Investing / Finance",
];

const DEAL_BREAKERS_LIST: string[] = [
  "No smoking indoors",
  "No recreational drugs",
  "Quiet after midnight",
  "No frequent overnight guests",
  "Pet-free required",
  "Equal chore sharing",
  "No parties at home",
  "No loud music",
  "Dishes done daily",
  "Shared grocery costs",
  "No messy common areas",
  "Separate food only",
  "Respect sleep schedules",
  "No significant others staying over",
  "Minimal noise during work hours",
];

// ── Survey questions data ─────────────────────────────────────────────────────

type SurveyAnswer = { label: string; sublabel: string; score: SurveyScore };
type SurveyQuestion = {
  category: CategoryKey;
  type: "behavior" | "expectation";
  question: string;
  qKey: keyof SurveyScores;
  answers: [SurveyAnswer, SurveyAnswer, SurveyAnswer, SurveyAnswer];
};

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    category: "cleanliness",
    type: "behavior",
    qKey: "q1",
    question: "Your friend is crashing on your couch tonight with zero notice. You let them in. What do they walk into?",
    answers: [
      { label: "A", sublabel: "A clean space — it pretty much always looks like this.", score: 0.5 },
      { label: "B", sublabel: "Lived in but presentable, nothing embarrassing.", score: 1.0 },
      { label: "C", sublabel: "I'd be doing a quick scramble tidy while they're taking their shoes off.", score: 1.5 },
      { label: "D", sublabel: "A genuine mess — I'd warn them in advance honestly.", score: 2.0 },
    ],
  },
  {
    category: "cleanliness",
    type: "expectation",
    qKey: "q2",
    question: "You see a great apartment listing, but then you see photos of the current tenant's space. Which kills the vibe?",
    answers: [
      { label: "A", sublabel: "Dishes stacked in the sink in the listing photos.", score: 0.5 },
      { label: "B", sublabel: "Stuff piled on every counter but the floor is clear.", score: 1.0 },
      { label: "C", sublabel: "Visibly dusty shelves and fingerprint-smudged surfaces.", score: 1.5 },
      { label: "D", sublabel: "None of it — I'm renting the bones of the apartment, not their lifestyle.", score: 2.0 },
    ],
  },
  {
    category: "socialEnergy",
    type: "behavior",
    qKey: "q3",
    question: "It's a rare Saturday with zero obligations. How do you spend the first 4 hours of your day?",
    answers: [
      { label: "A", sublabel: "Totally solo — reading, gaming, or a walk. I need silence to \"reset.\"", score: 0.5 },
      { label: "B", sublabel: "Slow start at home, but I'll probably text a friend to see what they're doing later.", score: 1.0 },
      { label: "C", sublabel: "Out and about — I'd rather grab a coffee with someone than sit at home.", score: 1.5 },
      { label: "D", sublabel: "I'm probably hosting a group or at a busy event; I feel best around people.", score: 2.0 },
    ],
  },
  {
    category: "socialEnergy",
    type: "expectation",
    qKey: "q4",
    question: "You're at a quiet café. A stranger sits next to you and starts a quiet phone call. What's your internal reaction?",
    answers: [
      { label: "A", sublabel: "It's a major distraction — hard to focus once someone else is talking.", score: 0.5 },
      { label: "B", sublabel: "A little annoying, but headphones fix it within a minute.", score: 1.0 },
      { label: "C", sublabel: "I barely notice — background talking actually helps me focus.", score: 1.5 },
      { label: "D", sublabel: "I find it interesting; the \"life\" in the room is comforting.", score: 2.0 },
    ],
  },
  {
    category: "sleepSchedule",
    type: "behavior",
    qKey: "q5",
    question: "If you were on a desert island with no clocks, what time would your body naturally wake up and sleep?",
    answers: [
      { label: "A", sublabel: "Wake with the sun (6 am), asleep shortly after dark (9–10 pm).", score: 0.5 },
      { label: "B", sublabel: "A standard 8 am wake-up and an 11 pm bedtime.", score: 1.0 },
      { label: "C", sublabel: "Wake up late morning (10 am), asleep in the early hours (1–2 am).", score: 1.5 },
      { label: "D", sublabel: "I'm a total night creature — up until 4 am, sleeping through the day.", score: 2.0 },
    ],
  },
  {
    category: "sleepSchedule",
    type: "expectation",
    qKey: "q6",
    question: "You're in a hotel and can hear a muffled TV from the room next door. At what point is it a problem?",
    answers: [
      { label: "A", sublabel: "Any time after 9 pm — I need near-silence to feel my day has ended.", score: 0.5 },
      { label: "B", sublabel: "If it's still going past midnight, it would bother my sleep.", score: 1.0 },
      { label: "C", sublabel: "As long as it's just a muffle and not a shout, I can sleep through anything.", score: 1.5 },
      { label: "D", sublabel: "I actually find white noise or distant TV sounds helpful for falling asleep.", score: 2.0 },
    ],
  },
  {
    category: "guests",
    type: "behavior",
    qKey: "q7",
    question: "Your friend group is figuring out where to watch the game this weekend. What role do you play?",
    answers: [
      { label: "A", sublabel: "\"Come to mine\" — I like hosting, my place is always open.", score: 2.0 },
      { label: "B", sublabel: "I'd offer if no one else does, but I'm not the first to suggest it.", score: 1.5 },
      { label: "C", sublabel: "Happy to go wherever — just not really a host person.", score: 1.0 },
      { label: "D", sublabel: "I'd rather go to a bar or someone else's — I keep my space pretty personal.", score: 0.5 },
    ],
  },
  {
    category: "guests",
    type: "expectation",
    qKey: "q8",
    question: "You're casting a reality show about living situations. Which character stresses you out most as a roommate?",
    answers: [
      { label: "A", sublabel: "The one whose friends treat the apartment like their second home.", score: 0.5 },
      { label: "B", sublabel: "The one who disappears for weeks then reappears with a suitcase full of people.", score: 0.8 },
      { label: "C", sublabel: "The one who never has anyone over and makes you feel guilty for it.", score: 1.6 },
      { label: "D", sublabel: "The one who schedules every social interaction two weeks in advance.", score: 2.0 },
    ],
  },
  {
    category: "lifestyle",
    type: "behavior",
    qKey: "q9",
    question: "You're deep in focus on a task. What's your ideal ambient environment?",
    answers: [
      { label: "A", sublabel: "Total sensory blackout — no music, neutral lighting, no scents.", score: 0.5 },
      { label: "B", sublabel: "Very controlled — a specific playlist and perhaps a scented candle I chose.", score: 1.0 },
      { label: "C", sublabel: "Normal activity — window open, street noise, whatever smells are in the air.", score: 1.5 },
      { label: "D", sublabel: "High intensity — TV on, bright lights, and high activity.", score: 2.0 },
    ],
  },
  {
    category: "lifestyle",
    type: "expectation",
    qKey: "q10",
    question: "You check into an Airbnb and notice a faint lingering smell of the previous guest's cooking. How does this affect your stay?",
    answers: [
      { label: "A", sublabel: "Very difficult to relax until the smell is completely gone.", score: 0.5 },
      { label: "B", sublabel: "Slightly bothered — I'd open all the windows to reset the air.", score: 1.0 },
      { label: "C", sublabel: "I'd notice it for five minutes and then forget it exists.", score: 1.5 },
      { label: "D", sublabel: "I wouldn't notice it at all unless someone else pointed it out.", score: 2.0 },
    ],
  },
];

// ── Small reusable UI components ──────────────────────────────────────────────

function Chips<T extends string>({
  options,
  selected,
  onToggle,
  color = RED,
}: {
  options: string[];
  selected: T[];
  onToggle: (v: T) => void;
  color?: string;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = selected.includes(opt as T);
        return (
          <Pressable
            key={opt}
            style={[chipStyles.chip, active && { backgroundColor: color + "15", borderColor: color }]}
            onPress={() => onToggle(opt as T)}
          >
            <Text style={[chipStyles.chipText, active && { color, fontWeight: "700" }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
  },
  chipText: { fontSize: 13, color: "#374151" },
});

function ToggleChips<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[s.toggleChip, active && s.toggleChipActive]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[s.toggleChipText, active && s.toggleChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { user, markOnboardingDone } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // ─── Step 1: Basic info ────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [photoUrl, setPhotoUrl] = useState(""); // local URI or uploaded URL
  const [uploading, setUploading] = useState(false);
  const [program, setProgram] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [moveInDate, setMoveInDate] = useState("");

  // ─── Step 2: Category priority ranking ────────────────────────────────
  const [priorities, setPriorities] = useState<CategoryKey[]>([...ALL_CATEGORIES]);

  // ─── Step 3: Survey answers ────────────────────────────────────────────
  const [surveyQ, setSurveyQ] = useState(0); // 0-9 current question index
  const [surveyAnswers, setSurveyAnswers] = useState<Partial<SurveyScores>>({});
  const [surveyComplete, setSurveyComplete] = useState(false); // all 10 done
  const [surveyEditMode, setSurveyEditMode] = useState(false); // editing a single Q

  // ─── Step 4: Hard filters ──────────────────────────────────────────────
  const [substanceEnv, setSubstanceEnv] = useState<SubstanceEnv>("smoke-free");
  const [hasDog, setHasDog] = useState(false);
  const [hasCat, setHasCat] = useState(false);
  const [petAllergy, setPetAllergy] = useState<PetAllergy>("none");
  const [openToPets, setOpenToPets] = useState(true);
  const [leaseDuration, setLeaseDuration] = useState<LeaseDuration>("8-months");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // ─── Step 5: Review extras ─────────────────────────────────────────────
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>([]);
  const [instagramHandle, setInstagramHandle] = useState("");

  // ── Navigation helpers ───────────────────────────────────────────────────────

  function canGoNext(): boolean {
    if (step === 1) return firstName.trim().length > 0 && program.trim().length > 0 && bio.trim().length > 0;
    if (step === 3) return false; // survey auto-advances; Next disabled
    return true;
  }

  function handleBack() {
    if (step === 3 && surveyEditMode) {
      setSurveyEditMode(false);
      return;
    }
    if (step === 3 && surveyComplete) {
      // On the survey-complete review view: back goes to priority ranking
      setSurveyComplete(false);
      setStep(2);
      return;
    }
    if (step === 3 && surveyQ > 0) {
      // Within sequential survey: go back one question
      setSurveyQ((q) => q - 1);
      return;
    }
    if (step === 3 && surveyQ === 0) {
      // Start of survey: go back to priority ranking
      setStep(2);
      return;
    }
    if (step > 1) setStep((s) => s - 1);
  }

  function handleNext() {
    if (step === 3) return; // survey auto-advances
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  // ── Survey answer handler ────────────────────────────────────────────────────

  function handleSurveyAnswer(qKey: keyof SurveyScores, score: SurveyScore) {
    const updated = { ...surveyAnswers, [qKey]: score };
    setSurveyAnswers(updated);
    if (surveyEditMode) {
      // User was editing a single question from the review view — return to it
      setSurveyEditMode(false);
      return;
    }
    if (surveyQ < SURVEY_QUESTIONS.length - 1) {
      setSurveyQ((q) => q + 1);
    } else {
      // All 10 questions answered — advance to step 4
      setSurveyComplete(true);
      setStep(4);
    }
  }

  // ── Category priority ranking ────────────────────────────────────────────────

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...priorities];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setPriorities(next);
  }

  function moveDown(index: number) {
    if (index === priorities.length - 1) return;
    const next = [...priorities];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setPriorities(next);
  }

  // ── Photo picker ──────────────────────────────────────────────────────────────

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
    }
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!user) return;
    const scores = surveyAnswers as SurveyScores;
    if (Object.keys(scores).length < 10) {
      Alert.alert("Survey incomplete", "Please complete all 10 survey questions.");
      setStep(3);
      setSurveyQ(0);
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoUrl && !photoUrl.startsWith("http")) {
        setUploading(true);
        finalPhotoUrl = await uploadProfilePhoto(user.uid, photoUrl);
        setUploading(false);
      }

      const derived = deriveSurveyDisplayFields(scores);

      const profile: Profile = {
        id: user.uid,
        firstName: firstName.trim(),
        age: age ? parseInt(age, 10) || undefined : undefined,
        gender: (gender as Gender) || undefined,
        program: program.trim(),
        bio: bio.trim(),
        photoUrl: finalPhotoUrl || undefined,
        moveInDate: moveInDate || undefined,
        // Derived display fields from survey
        ...derived,
        noiseTolerance: "moderate",
        // Survey data
        surveyScores: scores,
        categoryPriorities: priorities,
        // Hard filters
        substanceEnv,
        hasDog,
        hasCat,
        petAllergy,
        openToPets,
        leaseDuration,
        budgetMin: budgetMin ? parseInt(budgetMin, 10) || undefined : undefined,
        budgetMax: budgetMax ? parseInt(budgetMax, 10) || undefined : undefined,
        // Optional extras
        hobbies: selectedHobbies.length > 0 ? selectedHobbies : undefined,
        dealBreakers: selectedDealBreakers.length > 0 ? selectedDealBreakers : undefined,
        instagramHandle: instagramHandle.trim() || undefined,
      };

      await saveProfile(profile);
      await saveOnboarded(user.uid);
      markOnboardingDone();
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const showBackBtn = step > 1;
  const showNextBtn = step !== 3 && step < TOTAL_STEPS;
  const showSubmitBtn = step === TOTAL_STEPS;

  // Progress: for step 3, factor in survey sub-progress
  const progressValue =
    step === 3
      ? ((2 + surveyQ / SURVEY_QUESTIONS.length) / TOTAL_STEPS)
      : ((step - 1) / TOTAL_STEPS);

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progressValue * 100}%` }]} />
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Basic Info ────────────────────────────────────────── */}
        {step === 1 && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 1 of {TOTAL_STEPS}</Text>
            <Text style={s.stepTitle}>Basic Profile</Text>
            <Text style={s.stepSubtitle}>Tell potential roommates who you are.</Text>

            {/* Photo picker */}
            <Pressable style={s.photoPicker} onPress={pickPhoto}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={s.photoPreview} />
              ) : (
                <View style={s.photoPlaceholder}>
                  <FontAwesome name="camera" size={28} color="#9ca3af" />
                  <Text style={s.photoHint}>Add photo</Text>
                </View>
              )}
            </Pressable>

            <View style={s.field}>
              <Text style={s.fieldLabel}>First name *</Text>
              <TextInput
                style={s.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Alex"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Program / Occupation *</Text>
              <TextInput
                style={s.input}
                value={program}
                onChangeText={setProgram}
                placeholder="e.g. Computer Science at UofG"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Age</Text>
              <TextInput
                style={s.input}
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 21"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Bio *{" "}
                <Text style={s.charCount}>{bio.length}/250</Text>
              </Text>
              <TextInput
                style={[s.input, s.bioInput]}
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, 250))}
                placeholder="A short intro about yourself…"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <ToggleChips<Gender>
              label="Gender (optional)"
              options={GENDER_OPTIONS}
              value={gender as Gender}
              onSelect={(v) => setGender(gender === v ? "" : v)}
            />

            <View style={[s.field, { marginTop: 16 }]}>
              <Text style={s.fieldLabel}>Earliest move-in date (optional)</Text>
              <TextInput
                style={s.input}
                value={moveInDate}
                onChangeText={setMoveInDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* ── Step 2: Category Priority Ranking ──────────────────────────── */}
        {step === 2 && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 2 of {TOTAL_STEPS}</Text>
            <Text style={s.stepTitle}>What Matters Most?</Text>
            <Text style={s.stepSubtitle}>
              Rank these five lifestyle categories from most to least important to you.
              The top category gets the highest weight in your roommate matches.
            </Text>

            <View style={s.priorityList}>
              {priorities.map((cat, index) => (
                <View key={cat} style={s.priorityRow}>
                  {/* Rank badge */}
                  <View style={s.rankBadge}>
                    <Text style={s.rankNumber}>{index + 1}</Text>
                    <Text style={s.rankMult}>×{PRIORITY_MULTIPLIERS[index].toFixed(2)}</Text>
                  </View>

                  {/* Label */}
                  <Text style={s.priorityLabel}>{CATEGORY_LABELS[cat]}</Text>

                  {/* Up / Down controls */}
                  <View style={s.priorityControls}>
                    <Pressable
                      style={[s.priorityArrow, index === 0 && s.priorityArrowDisabled]}
                      onPress={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <FontAwesome name="chevron-up" size={12} color={index === 0 ? "#d1d5db" : RED} />
                    </Pressable>
                    <Pressable
                      style={[s.priorityArrow, index === priorities.length - 1 && s.priorityArrowDisabled]}
                      onPress={() => moveDown(index)}
                      disabled={index === priorities.length - 1}
                    >
                      <FontAwesome name="chevron-down" size={12} color={index === priorities.length - 1 ? "#d1d5db" : RED} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.helperBox}>
              <Text style={s.helperText}>
                Categories ranked higher get amplified in your compatibility scores. If cleanliness is a dealbreaker for you, put it first.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 3: Survey ─────────────────────────────────────────────── */}
        {step === 3 && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 3 of {TOTAL_STEPS}</Text>
            <Text style={s.stepTitle}>Behavioral Survey</Text>

            {/* If all questions are already answered (user navigated back from step 4) */}
            {surveyComplete && !surveyEditMode ? (
              <>
                <View style={s.surveyCompleteBanner}>
                  <Text style={s.surveyCompleteIcon}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.surveyCompleteTitle}>Survey complete</Text>
                    <Text style={s.surveyCompleteSubtitle}>All 10 questions answered. You can continue or revisit questions below.</Text>
                  </View>
                </View>
                <Pressable style={s.nextBtn} onPress={() => setStep(4)}>
                  <Text style={s.nextBtnText}>Continue to Filters</Text>
                  <FontAwesome name="chevron-right" size={14} color="#fff" />
                </Pressable>
                <Text style={[s.stepSubtitle, { marginTop: 12 }]}>Or tap any question to review:</Text>
                {SURVEY_QUESTIONS.map((q, idx) => {
                  const answered = surveyAnswers[q.qKey];
                  const answerLabel = q.answers.find((a) => a.score === answered);
                  return (
                    <Pressable
                      key={q.qKey}
                      style={s.reviewQRow}
                      onPress={() => { setSurveyQ(idx); setSurveyEditMode(true); }}
                    >
                      <Text style={s.reviewQNum}>{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reviewQText} numberOfLines={1}>{q.question}</Text>
                        {answerLabel && (
                          <Text style={s.reviewQAnswer}>{answerLabel.label}: {answerLabel.sublabel}</Text>
                        )}
                      </View>
                      <FontAwesome name="pencil" size={12} color="#9ca3af" />
                    </Pressable>
                  );
                })}
              </>
            ) : (
              <>
                {/* Survey progress */}
                <View style={s.surveyProgressRow}>
                  <Text style={s.surveyProgressText}>Question {surveyQ + 1} of {SURVEY_QUESTIONS.length}</Text>
                  <View style={s.surveyBar}>
                    <View style={[s.surveyBarFill, { width: `${((surveyQ) / SURVEY_QUESTIONS.length) * 100}%` }]} />
                  </View>
                </View>

                {/* Category badge */}
                <View style={s.categoryBadge}>
                  <Text style={s.categoryBadgeText}>
                    {CATEGORY_LABELS[SURVEY_QUESTIONS[surveyQ].category]}
                    {" · "}
                    {SURVEY_QUESTIONS[surveyQ].type === "behavior" ? "Your behaviour" : "Your expectation"}
                  </Text>
                </View>

                {/* Question */}
                <Text style={s.surveyQuestion}>{SURVEY_QUESTIONS[surveyQ].question}</Text>

                {/* Answer options — tap to auto-advance */}
                <View style={s.surveyAnswers}>
                  {SURVEY_QUESTIONS[surveyQ].answers.map((ans) => {
                    const currentKey = SURVEY_QUESTIONS[surveyQ].qKey;
                    const isSelected = surveyAnswers[currentKey] === ans.score;
                    return (
                      <Pressable
                        key={ans.label}
                        style={[s.surveyOption, isSelected && s.surveyOptionSelected]}
                        onPress={() => handleSurveyAnswer(currentKey, ans.score)}
                      >
                        <View style={[s.surveyOptionBadge, isSelected && s.surveyOptionBadgeSelected]}>
                          <Text style={[s.surveyOptionBadgeText, isSelected && s.surveyOptionBadgeTextSelected]}>
                            {ans.label}
                          </Text>
                        </View>
                        <Text style={[s.surveyOptionText, isSelected && s.surveyOptionTextSelected]}>
                          {ans.sublabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={s.tapHint}>Tap an answer to continue →</Text>
              </>
            )}
          </View>
        )}

        {/* ── Step 4: Hard Filters ───────────────────────────────────────── */}
        {step === 4 && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 4 of {TOTAL_STEPS}</Text>
            <Text style={s.stepTitle}>Filters & Dealbreakers</Text>
            <Text style={s.stepSubtitle}>
              These hard filters exclude incompatible profiles before matching scores are calculated.
            </Text>

            <ToggleChips<SubstanceEnv>
              label="Substance environment"
              options={SUBSTANCE_OPTIONS}
              value={substanceEnv}
              onSelect={setSubstanceEnv}
            />

            <View style={[s.field, { marginTop: 20 }]}>
              <Text style={s.fieldLabel}>Pets you have</Text>
              <View style={s.toggleRow}>
                <Pressable
                  style={[s.toggleBtn, hasDog && s.toggleBtnActive]}
                  onPress={() => setHasDog(!hasDog)}
                >
                  <Text style={[s.toggleBtnText, hasDog && s.toggleBtnTextActive]}>🐶 Dog</Text>
                </Pressable>
                <Pressable
                  style={[s.toggleBtn, hasCat && s.toggleBtnActive]}
                  onPress={() => setHasCat(!hasCat)}
                >
                  <Text style={[s.toggleBtnText, hasCat && s.toggleBtnTextActive]}>🐱 Cat</Text>
                </Pressable>
              </View>
            </View>

            <ToggleChips<PetAllergy>
              label="Pet allergies"
              options={PET_ALLERGY_OPTIONS}
              value={petAllergy}
              onSelect={setPetAllergy}
            />

            <View style={[s.field, { marginTop: 16 }]}>
              <Text style={s.fieldLabel}>Open to living with pets?</Text>
              <View style={s.toggleRow}>
                <Pressable
                  style={[s.toggleBtn, openToPets && s.toggleBtnActive]}
                  onPress={() => setOpenToPets(true)}
                >
                  <Text style={[s.toggleBtnText, openToPets && s.toggleBtnTextActive]}>Yes</Text>
                </Pressable>
                <Pressable
                  style={[s.toggleBtn, !openToPets && s.toggleBtnActive]}
                  onPress={() => setOpenToPets(false)}
                >
                  <Text style={[s.toggleBtnText, !openToPets && s.toggleBtnTextActive]}>No</Text>
                </Pressable>
              </View>
            </View>

            <ToggleChips<LeaseDuration>
              label="Preferred lease length"
              options={LEASE_OPTIONS}
              value={leaseDuration}
              onSelect={setLeaseDuration}
            />

            <View style={[s.field, { marginTop: 16 }]}>
              <Text style={s.fieldLabel}>Monthly budget range (CAD)</Text>
              <View style={s.budgetRow}>
                <TextInput
                  style={[s.input, s.budgetInput]}
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="Min $"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={s.budgetSep}>–</Text>
                <TextInput
                  style={[s.input, s.budgetInput]}
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="Max $"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 5: Review & Submit ────────────────────────────────────── */}
        {step === 5 && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 5 of {TOTAL_STEPS}</Text>
            <Text style={s.stepTitle}>Review & Create Profile</Text>
            <Text style={s.stepSubtitle}>Take a look at your profile before going live.</Text>

            {/* Summary cards */}
            <View style={s.reviewCard}>
              <Text style={s.reviewCardTitle}>Basic Info</Text>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={s.reviewPhoto} />
              ) : null}
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Name: </Text>{firstName || "—"}</Text>
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Program: </Text>{program || "—"}</Text>
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Age: </Text>{age || "—"}</Text>
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Move-in: </Text>{moveInDate || "—"}</Text>
              <Text style={s.reviewLine} numberOfLines={3}>
                <Text style={s.reviewKey}>Bio: </Text>{bio || "—"}
              </Text>
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewCardTitle}>Category Priorities</Text>
              {priorities.map((cat, i) => (
                <Text key={cat} style={s.reviewLine}>
                  {i + 1}. {CATEGORY_LABELS[cat]}
                  <Text style={{ color: "#9ca3af" }}> ×{PRIORITY_MULTIPLIERS[i].toFixed(2)}</Text>
                </Text>
              ))}
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewCardTitle}>Survey</Text>
              <Text style={s.reviewLine}>
                {Object.keys(surveyAnswers).length}/10 questions answered
                {Object.keys(surveyAnswers).length < 10 && (
                  <Text style={{ color: RED }}> — incomplete!</Text>
                )}
              </Text>
              {Object.keys(surveyAnswers).length < 10 && (
                <Pressable onPress={() => { setStep(3); setSurveyQ(0); }}>
                  <Text style={s.reviewEditLink}>Complete survey →</Text>
                </Pressable>
              )}
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewCardTitle}>Filters</Text>
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Substance: </Text>{substanceEnv}</Text>
              <Text style={s.reviewLine}>
                <Text style={s.reviewKey}>Pets: </Text>
                {hasDog && hasCat ? "Dog & Cat" : hasDog ? "Dog" : hasCat ? "Cat" : "None"}
              </Text>
              <Text style={s.reviewLine}><Text style={s.reviewKey}>Lease: </Text>{leaseDuration}</Text>
              {(budgetMin || budgetMax) && (
                <Text style={s.reviewLine}>
                  <Text style={s.reviewKey}>Budget: </Text>
                  {budgetMin ? `$${budgetMin}` : "?"}–{budgetMax ? `$${budgetMax}/mo` : "?"}
                </Text>
              )}
            </View>

            {/* Optional: Hobbies */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Hobbies (optional)</Text>
              <Chips<string>
                options={HOBBIES_LIST}
                selected={selectedHobbies}
                onToggle={(h) =>
                  setSelectedHobbies((prev) =>
                    prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
                  )
                }
              />
            </View>

            {/* Optional: Dealbreakers */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Deal Breakers (optional)</Text>
              <Chips<string>
                options={DEAL_BREAKERS_LIST}
                selected={selectedDealBreakers}
                onToggle={(d) =>
                  setSelectedDealBreakers((prev) =>
                    prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                  )
                }
                color="#dc2626"
              />
            </View>

            {/* Optional: Instagram */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Instagram handle (optional — revealed after matching)</Text>
              <TextInput
                style={s.input}
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                placeholder="@username"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <View style={s.navBar}>
        {showBackBtn ? (
          <Pressable style={s.backBtn} onPress={handleBack}>
            <FontAwesome name="chevron-left" size={14} color={RED} />
            <Text style={s.backBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={s.backBtnSpacer} />
        )}

        {step === 3 ? (
          // Survey step — no manual Next (auto-advances)
          <View style={{ flex: 1 }} />
        ) : showNextBtn ? (
          <Pressable
            style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canGoNext()}
          >
            <Text style={s.nextBtnText}>Next</Text>
            <FontAwesome name="chevron-right" size={14} color="#fff" />
          </Pressable>
        ) : showSubmitBtn ? (
          <Pressable
            style={[s.nextBtn, saving && s.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={s.nextBtnText}>Create Profile</Text>
                <FontAwesome name="check" size={14} color="#fff" />
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f5f5f7" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },

  // Progress bar
  progressBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: RED,
    borderRadius: 2,
  },

  // Step wrapper
  stepContainer: { gap: 16 },
  stepLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12 },
  stepTitle: { fontSize: 26, fontWeight: "800", color: "#111", marginTop: 2 },
  stepSubtitle: { fontSize: 14, color: "#6b7280", lineHeight: 21, marginBottom: 4 },

  // Field
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  charCount: { fontSize: 11, color: "#9ca3af", fontWeight: "400" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
  },
  bioInput: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 11,
  },

  // Toggle chips (single-select)
  toggleChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toggleChipActive: {
    borderColor: RED,
    backgroundColor: RED + "12",
  },
  toggleChipText: { fontSize: 13, color: "#374151" },
  toggleChipTextActive: { color: RED, fontWeight: "700" },

  // Photo picker
  photoPicker: { alignSelf: "center" },
  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#e5e7eb",
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoHint: { fontSize: 12, color: "#9ca3af" },

  // Priority ranking
  priorityList: { gap: 10 },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    width: 44,
    alignItems: "center",
    backgroundColor: RED + "10",
    borderRadius: 8,
    paddingVertical: 6,
  },
  rankNumber: { fontSize: 16, fontWeight: "800", color: RED },
  rankMult: { fontSize: 10, color: RED, fontWeight: "600" },
  priorityLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111" },
  priorityControls: { gap: 4 },
  priorityArrow: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  priorityArrowDisabled: { opacity: 0.3 },
  helperBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
  },
  helperText: { fontSize: 12, color: "#92400e", lineHeight: 18 },

  // Survey
  surveyProgressRow: { gap: 6 },
  surveyProgressText: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  surveyBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  surveyBarFill: {
    height: 4,
    backgroundColor: RED,
    borderRadius: 2,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: RED + "12",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryBadgeText: { fontSize: 12, color: RED, fontWeight: "700" },
  surveyQuestion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    lineHeight: 27,
  },
  surveyAnswers: { gap: 10 },
  surveyOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  surveyOptionSelected: {
    borderColor: RED,
    backgroundColor: RED + "08",
  },
  surveyOptionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  surveyOptionBadgeSelected: {
    backgroundColor: RED,
  },
  surveyOptionBadgeText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  surveyOptionBadgeTextSelected: { color: "#fff" },
  surveyOptionText: { fontSize: 14, color: "#374151", flex: 1, lineHeight: 21 },
  surveyOptionTextSelected: { color: "#111", fontWeight: "500" },
  tapHint: { fontSize: 12, color: "#d1d5db", alignSelf: "center", marginTop: 4 },

  // Survey complete view
  surveyCompleteBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 14,
  },
  surveyCompleteIcon: { fontSize: 22, color: "#16a34a" },
  surveyCompleteTitle: { fontSize: 15, fontWeight: "700", color: "#15803d" },
  surveyCompleteSubtitle: { fontSize: 13, color: "#166534", marginTop: 2, lineHeight: 19 },
  reviewQRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  reviewQNum: {
    fontSize: 13,
    fontWeight: "800",
    color: RED,
    width: 22,
    textAlign: "center",
  },
  reviewQText: { fontSize: 13, color: "#111", fontWeight: "600" },
  reviewQAnswer: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  // Toggle row (yes/no)
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleBtnActive: {
    borderColor: RED,
    backgroundColor: RED + "12",
  },
  toggleBtnText: { fontSize: 14, color: "#374151" },
  toggleBtnTextActive: { color: RED, fontWeight: "700" },

  // Budget
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  budgetInput: { flex: 1 },
  budgetSep: { fontSize: 18, color: "#9ca3af" },

  // Review
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 6,
  },
  reviewCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewLine: { fontSize: 13, color: "#374151", lineHeight: 20 },
  reviewKey: { fontWeight: "700", color: "#111" },
  reviewPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e5e7eb",
    marginBottom: 4,
  },
  reviewEditLink: {
    fontSize: 13,
    color: RED,
    fontWeight: "700",
    marginTop: 4,
  },

  // Bottom nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { fontSize: 15, color: RED, fontWeight: "600" },
  backBtnSpacer: { width: 80 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: RED,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: 15, color: "#fff", fontWeight: "700" },
});
