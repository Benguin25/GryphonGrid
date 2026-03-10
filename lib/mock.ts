import { Profile, CategoryKey, SurveyScores, SurveyScore } from "./types";

// ── Priority multipliers (ALGO.md) ───────────────────────────────────────────
// Rank 1 (most important) → 1.85 … Rank 5 (least important) → 0.70
export const PRIORITY_MULTIPLIERS: readonly number[] = [1.85, 1.55, 1.25, 0.95, 0.70];

// The five lifestyle categories in their default display order.
export const ALL_CATEGORIES: CategoryKey[] = [
  "cleanliness",
  "socialEnergy",
  "sleepSchedule",
  "guests",
  "lifestyle",
];

// Survey behavior / expectation question keys per category.
const CATEGORY_QUESTIONS: Record<
  CategoryKey,
  [keyof SurveyScores, keyof SurveyScores]
> = {
  cleanliness:   ["q1",  "q2"],
  socialEnergy:  ["q3",  "q4"],
  sleepSchedule: ["q5",  "q6"],
  guests:        ["q7",  "q8"],
  lifestyle:     ["q9",  "q10"],
};

/**
 * MaxDistance is always constant regardless of how users rank categories,
 * because each user's 5 priority multipliers always sum to 6.30.
 *
 * MaxBehaviorDist   = 2.0 − 0.5 = 1.5
 * MaxExpDist        = (1.5 + 1.5) / 2 = 1.5
 * MaxCategoryAvg    = (1.5 + 1.5) / 2 = 1.5
 * SumCombinedMults  = (6.30 + 6.30) / 2 = 6.30
 * MaxDistance       = 1.5 × 6.30 = 9.45
 */
const MAX_DISTANCE = 9.45;

// ── Mock profiles ─────────────────────────────────────────────────────────────

export const MOCK_PROFILES: Profile[] = [
  {
    id: "alex",
    firstName: "Alex",
    age: 21,
    gender: "male",
    program: "Computer Science",
    bio: "3rd year CS student. Early riser, keep things tidy. Love hiking on weekends. Looking for a chill housemate.",
    photoUrl: "https://i.pravatar.cc/300?img=11",
    // Legacy display fields
    sleepSchedule: "normal",
    cleanliness: 4,
    prefCleanliness: 4,
    socialEnergy: 2,
    prefSocialEnergy: 3,
    guestsFrequency: "rarely",
    prefGuestsFrequency: "frequently",
    substanceEnv: "smoke-free",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "moderate",
    leaseDuration: "8-months",
    moveInDate: "2026-05-01",
    // Survey scores
    surveyScores: {
      q1: 0.5,  // cleanliness behavior: always clean
      q2: 0.5,  // cleanliness expectation: bothered by dishes
      q3: 1.0,  // social behavior: slow start, text friend later
      q4: 1.5,  // social expectation: background talking helps focus
      q5: 1.0,  // sleep behavior: standard 8am/11pm
      q6: 1.0,  // sleep expectation: bothered past midnight
      q7: 1.0,  // guests behavior: happy to go, not a host (C=1.0 inverted)
      q8: 2.0,  // guests expectation: stressed by scheduler = fine with guests
      q9: 1.0,  // lifestyle behavior: specific playlist and candle
      q10: 1.0, // lifestyle expectation: slightly bothered by smell
    },
    categoryPriorities: ["cleanliness", "sleepSchedule", "guests", "socialEnergy", "lifestyle"],
  },
  {
    id: "margret",
    firstName: "Margret",
    age: 23,
    gender: "female",
    program: "Biology",
    bio: "Quiet, calm, looking for a stable mid-term roommate situation. I have a cat named Biscuit.",
    photoUrl: "https://i.pravatar.cc/300?img=5",
    // Legacy display fields
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 5,
    socialEnergy: 1,
    prefSocialEnergy: 1,
    guestsFrequency: "rarely",
    prefGuestsFrequency: "rarely",
    substanceEnv: "smoke-free",
    hasDog: false,
    hasCat: true,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "quiet",
    leaseDuration: "12-plus",
    moveInDate: "2026-04-15",
    // Survey scores
    surveyScores: {
      q1: 0.5,  // always clean
      q2: 0.5,  // bothered by dishes
      q3: 0.5,  // solo, silence to reset
      q4: 0.5,  // major distraction
      q5: 0.5,  // wake with sun
      q6: 0.5,  // needs quiet after 9pm
      q7: 0.5,  // keeps space personal (D=0.5 inverted)
      q8: 0.5,  // stressed by friends treating apt as second home
      q9: 0.5,  // sensory blackout
      q10: 0.5, // very difficult with lingering smell
    },
    categoryPriorities: ["cleanliness", "sleepSchedule", "socialEnergy", "lifestyle", "guests"],
  },
  {
    id: "jordan",
    firstName: "Jordan",
    age: 22,
    gender: "non-binary",
    program: "Co-op (Software)",
    bio: "On a 4-month work term. Social, but respectful of space. Big into cooking and board games.",
    photoUrl: "https://i.pravatar.cc/300?img=15",
    // Legacy display fields
    sleepSchedule: "normal",
    cleanliness: 3,
    prefCleanliness: 3,
    socialEnergy: 4,
    prefSocialEnergy: 3,
    guestsFrequency: "occasionally",
    prefGuestsFrequency: "frequently",
    substanceEnv: "alcohol-ok",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: false,
    noiseTolerance: "moderate",
    leaseDuration: "4-months",
    moveInDate: "2026-05-05",
    // Survey scores
    surveyScores: {
      q1: 1.0,  // cleanliness behavior: lived-in but presentable
      q2: 1.0,  // expectation: stuff on counters ok if floor clear
      q3: 1.5,  // social behavior: out and about, coffee with someone
      q4: 1.5,  // social expectation: barely notice, background talk helps
      q5: 1.0,  // sleep behavior: standard 8am/11pm
      q6: 1.0,  // sleep expectation: bothered past midnight
      q7: 1.5,  // guests behavior: offer if no one else does (B=1.5 inverted)
      q8: 2.0,  // guests expectation: stressed by scheduler (D=2.0)
      q9: 1.5,  // lifestyle behavior: window open, street noise
      q10: 1.5, // lifestyle expectation: notice smell 5 min then forget
    },
    categoryPriorities: ["socialEnergy", "lifestyle", "guests", "sleepSchedule", "cleanliness"],
  },
  {
    id: "priya",
    firstName: "Priya",
    age: 24,
    gender: "female",
    program: "Engineering",
    bio: "Grad student, mostly home in the evenings. Very clean. Need a quiet space for studying. Allergic to dogs.",
    photoUrl: "https://i.pravatar.cc/300?img=47",
    // Legacy display fields
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 5,
    socialEnergy: 1,
    prefSocialEnergy: 1,
    guestsFrequency: "rarely",
    prefGuestsFrequency: "rarely",
    substanceEnv: "no-substances",
    hasDog: false,
    hasCat: false,
    petAllergy: "dog",
    openToPets: false,
    noiseTolerance: "quiet",
    leaseDuration: "12-plus",
    moveInDate: "2026-05-01",
    // Survey scores
    surveyScores: {
      q1: 0.5,  // always clean
      q2: 0.5,  // bothered by dishes
      q3: 0.5,  // totally solo, silence to reset
      q4: 0.5,  // major distraction
      q5: 0.5,  // wake with sun
      q6: 0.5,  // needs quiet after 9pm
      q7: 0.5,  // keeps space personal (D=0.5 inverted)
      q8: 0.5,  // stressed by friends treating apt as second home
      q9: 0.5,  // total sensory blackout
      q10: 0.5, // very difficult with lingering smell
    },
    categoryPriorities: ["cleanliness", "sleepSchedule", "socialEnergy", "guests", "lifestyle"],
  },
  {
    id: "mike",
    firstName: "Mike",
    age: 20,
    gender: "male",
    program: "Business",
    bio: "1st year business. Super outgoing. I work some nights so my schedule varies. Dog owner, he's friendly.",
    photoUrl: "https://i.pravatar.cc/300?img=3",
    // Legacy display fields
    sleepSchedule: "shift",
    cleanliness: 2,
    prefCleanliness: 1,
    socialEnergy: 5,
    prefSocialEnergy: 4,
    guestsFrequency: "frequently",
    prefGuestsFrequency: "frequently",
    substanceEnv: "420-friendly",
    hasDog: true,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "background-ok",
    leaseDuration: "8-months",
    moveInDate: "2026-05-01",
    // Survey scores
    surveyScores: {
      q1: 2.0,  // cleanliness behavior: genuine mess
      q2: 2.0,  // expectation: renting the bones, not the lifestyle
      q3: 2.0,  // social behavior: hosting group or busy event
      q4: 2.0,  // social expectation: find background life comforting
      q5: 2.0,  // sleep behavior: up until 4am, shift worker
      q6: 2.0,  // sleep expectation: white noise helpful
      q7: 2.0,  // guests behavior: "come to mine" (A=2.0 inverted)
      q8: 2.0,  // guests expectation: stressed by scheduler (D=2.0)
      q9: 2.0,  // lifestyle behavior: TV on, bright lights, high activity
      q10: 2.0, // lifestyle expectation: wouldn't notice smell at all
    },
    categoryPriorities: ["socialEnergy", "guests", "lifestyle", "sleepSchedule", "cleanliness"],
  },
  {
    id: "sophie",
    firstName: "Sophie",
    age: 22,
    gender: "female",
    program: "Arts & Design",
    bio: "Night owl by nature. I paint late, keep headphones on. Chill, tidy, and low drama.",
    photoUrl: "https://i.pravatar.cc/300?img=25",
    // Legacy display fields
    sleepSchedule: "night-owl",
    cleanliness: 4,
    prefCleanliness: 3,
    socialEnergy: 3,
    prefSocialEnergy: 2,
    guestsFrequency: "occasionally",
    prefGuestsFrequency: "occasionally",
    substanceEnv: "alcohol-ok",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "moderate",
    leaseDuration: "4-months",
    moveInDate: "2026-05-15",
    // Survey scores
    surveyScores: {
      q1: 1.0,  // cleanliness behavior: lived-in but presentable
      q2: 1.0,  // expectation: stuff piled on counters ok
      q3: 1.0,  // social behavior: slow start, text friend later
      q4: 1.5,  // social expectation: barely notice background talking
      q5: 2.0,  // sleep behavior: night creature, up until 4am
      q6: 2.0,  // sleep expectation: distant TV sounds helpful
      q7: 1.0,  // guests behavior: happy to go, not a host (C=1.0 inverted)
      q8: 2.0,  // guests expectation: stressed by the advance-scheduler
      q9: 1.0,  // lifestyle behavior: specific playlist while painting
      q10: 1.5, // lifestyle expectation: notice smell 5 min then forget
    },
    categoryPriorities: ["sleepSchedule", "lifestyle", "cleanliness", "socialEnergy", "guests"],
  },
  {
    id: "liam",
    firstName: "Liam",
    age: 25,
    gender: "male",
    program: "Working (Finance)",
    bio: "Full-time analyst. Early to bed. Clean, quiet, and keep to myself mostly. Long-term stability preferred.",
    photoUrl: "https://i.pravatar.cc/300?img=8",
    // Legacy display fields
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 5,
    socialEnergy: 1,
    prefSocialEnergy: 1,
    guestsFrequency: "rarely",
    prefGuestsFrequency: "rarely",
    substanceEnv: "smoke-free",
    hasDog: false,
    hasCat: false,
    petAllergy: "cat",
    openToPets: false,
    noiseTolerance: "quiet",
    leaseDuration: "12-plus",
    moveInDate: "2026-04-01",
    // Survey scores
    surveyScores: {
      q1: 0.5,  // always clean
      q2: 0.5,  // bothered by dishes
      q3: 0.5,  // totally solo
      q4: 0.5,  // major distraction
      q5: 0.5,  // wake with sun
      q6: 0.5,  // needs quiet after 9pm
      q7: 0.5,  // keeps space very personal (D=0.5 inverted)
      q8: 0.5,  // stressed by friends treating as second home
      q9: 0.5,  // total sensory blackout
      q10: 0.5, // very difficult with lingering smell
    },
    categoryPriorities: ["cleanliness", "sleepSchedule", "socialEnergy", "guests", "lifestyle"],
  },
  {
    id: "zara",
    firstName: "Zara",
    age: 21,
    gender: "female",
    program: "Nursing",
    bio: "Shift nurse so hours are weird but I'm respectful about noise. Clean and considerate. I have a small cat.",
    photoUrl: "https://i.pravatar.cc/300?img=44",
    // Legacy display fields
    sleepSchedule: "shift",
    cleanliness: 4,
    prefCleanliness: 3,
    socialEnergy: 3,
    prefSocialEnergy: 2,
    guestsFrequency: "rarely",
    prefGuestsFrequency: "rarely",
    substanceEnv: "smoke-free",
    hasDog: false,
    hasCat: true,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "moderate",
    leaseDuration: "12-plus",
    moveInDate: "2026-06-01",
    // Survey scores
    surveyScores: {
      q1: 1.0,  // cleanliness behavior: lived-in but presentable (clean=4, not 5)
      q2: 1.0,  // expectation: slightly bothered by clutter
      q3: 1.0,  // social behavior: slow start at home
      q4: 1.0,  // social expectation: headphones, won't bother after a minute
      q5: 2.0,  // sleep behavior: shift nurse, irregular hours
      q6: 1.5,  // sleep expectation: can sleep through muffle (nurse trained)
      q7: 0.5,  // guests behavior: keeps space very personal (D=0.5 inverted)
      q8: 0.5,  // guests expectation: stressed by friends treating as second home
      q9: 1.5,  // lifestyle behavior: window open, street noise, normal activity
      q10: 1.5, // lifestyle expectation: notice smell 5 min then forget
    },
    categoryPriorities: ["sleepSchedule", "cleanliness", "guests", "socialEnergy", "lifestyle"],
  },
];

// ── Matching algorithm ────────────────────────────────────────────────────────

/**
 * Compute compatibility score (0–100) between two profiles.
 *
 * When both profiles have ALGO.md survey data (surveyScores + categoryPriorities),
 * the weighted distance formula from ALGO.md is used.
 *
 * Falls back to the legacy penalty system for profiles without survey data.
 */
export function computeMatch(a: Profile, b: Profile): number {
  if (a.surveyScores && b.surveyScores && a.categoryPriorities && b.categoryPriorities) {
    return computeMatchNew(a, b);
  }
  return computeMatchLegacy(a, b);
}

// ── New weighted-distance algorithm (ALGO.md) ─────────────────────────────────

function computeMatchNew(a: Profile, b: Profile): number {
  const aScores = a.surveyScores!;
  const bScores = b.surveyScores!;
  const aPriorities = a.categoryPriorities!;
  const bPriorities = b.categoryPriorities!;

  let totalDistance = 0;

  for (const cat of ALL_CATEGORIES) {
    const [behaviorKey, expectKey] = CATEGORY_QUESTIONS[cat];

    const behaviorA   = aScores[behaviorKey] as number;
    const behaviorB   = bScores[behaviorKey] as number;
    const expectA     = aScores[expectKey]   as number;
    const expectB     = bScores[expectKey]   as number;

    // BehaviorDistance = |Behavior_A − Behavior_B|
    const behaviorDist = Math.abs(behaviorA - behaviorB);

    // ExpectationDistance = (|Expectation_A − Behavior_B| + |Expectation_B − Behavior_A|) / 2
    const expectDist = (Math.abs(expectA - behaviorB) + Math.abs(expectB - behaviorA)) / 2;

    // CategoryAverage = (BehaviorDistance + ExpectationDistance) / 2
    const categoryAvg = (behaviorDist + expectDist) / 2;

    // Priority multiplier: average of each user's personal multiplier for this category
    const aRankIndex = aPriorities.indexOf(cat);
    const bRankIndex = bPriorities.indexOf(cat);
    const aMult = aRankIndex >= 0 ? PRIORITY_MULTIPLIERS[aRankIndex] : 1.25;
    const bMult = bRankIndex >= 0 ? PRIORITY_MULTIPLIERS[bRankIndex] : 1.25;
    const combinedMult = (aMult + bMult) / 2;

    totalDistance += categoryAvg * combinedMult;
  }

  // Convert to 0–100 compatibility score
  const surveyScore = 100 - (totalDistance / MAX_DISTANCE) * 100;

  // Hard constraints (symmetric — check both directions)
  let hardPenalty = 0;

  // Substance environment
  if (a.substanceEnv === "no-substances" && b.substanceEnv !== "no-substances") hardPenalty += 20;
  if (b.substanceEnv === "no-substances" && a.substanceEnv !== "no-substances") hardPenalty += 20;
  if (a.substanceEnv === "smoke-free" && b.substanceEnv === "420-friendly") hardPenalty += 15;
  if (b.substanceEnv === "smoke-free" && a.substanceEnv === "420-friendly") hardPenalty += 15;

  // Pet allergies
  if (a.petAllergy === "dog"  && b.hasDog)               hardPenalty += 40;
  if (a.petAllergy === "cat"  && b.hasCat)               hardPenalty += 40;
  if (a.petAllergy === "both" && (b.hasDog || b.hasCat)) hardPenalty += 50;
  if (!a.openToPets && (b.hasDog || b.hasCat))           hardPenalty += 25;
  if (b.petAllergy === "dog"  && a.hasDog)               hardPenalty += 40;
  if (b.petAllergy === "cat"  && a.hasCat)               hardPenalty += 40;
  if (b.petAllergy === "both" && (a.hasDog || a.hasCat)) hardPenalty += 50;
  if (!b.openToPets && (a.hasDog || a.hasCat))           hardPenalty += 25;

  // Cap hard penalty so it cannot nullify a great behavioral match entirely
  hardPenalty = Math.min(hardPenalty, 60);

  return Math.max(0, Math.min(100, Math.round(surveyScore - hardPenalty)));
}

// ── Legacy algorithm (profiles without survey scores) ─────────────────────────

function computeMatchLegacy(a: Profile, b: Profile): number {
  let score = 100;

  // Sleep schedule mismatch
  const scheduleScore: Record<string, number> = { early: 0, normal: 1, "night-owl": 2, shift: 3 };
  const diff = Math.abs((scheduleScore[a.sleepSchedule] ?? 1) - (scheduleScore[b.sleepSchedule] ?? 1));
  score -= diff * 10;

  // Cleanliness delta
  score -= Math.min(20, Math.abs(a.prefCleanliness - b.cleanliness) * 5);

  // Social energy delta
  score -= Math.min(20, Math.abs(a.prefSocialEnergy - b.socialEnergy) * 5);

  // Guests mismatch
  const gulf: Record<string, number> = { rarely: 0, occasionally: 1, frequently: 2 };
  score -= Math.abs((gulf[a.prefGuestsFrequency] ?? 1) - (gulf[b.guestsFrequency] ?? 1)) * 8;

  // Substance mismatch
  if (a.substanceEnv === "no-substances" && b.substanceEnv !== "no-substances") score -= 20;
  if (a.substanceEnv === "smoke-free" && b.substanceEnv === "420-friendly")     score -= 15;

  // Pet allergy
  if (a.petAllergy === "dog"  && b.hasDog)               score -= 40;
  if (a.petAllergy === "cat"  && b.hasCat)               score -= 40;
  if (a.petAllergy === "both" && (b.hasDog || b.hasCat)) score -= 50;
  if (!a.openToPets && (b.hasDog || b.hasCat))           score -= 25;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Utility: derive legacy display fields from survey scores ──────────────────

/**
 * Derives the legacy Profile display fields (cleanliness, socialEnergy, etc.)
 * from a completed set of ALGO.md survey scores.
 *
 * Called during onboarding so that profile display screens remain compatible
 * with new survey-based profiles.
 */
export function deriveSurveyDisplayFields(scores: SurveyScores): {
  sleepSchedule:       Profile["sleepSchedule"];
  cleanliness:         Profile["cleanliness"];
  prefCleanliness:     Profile["prefCleanliness"];
  socialEnergy:        Profile["socialEnergy"];
  prefSocialEnergy:    Profile["prefSocialEnergy"];
  guestsFrequency:     Profile["guestsFrequency"];
  prefGuestsFrequency: Profile["prefGuestsFrequency"];
} {
  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Score 0.5 = very clean → 5, Score 2.0 = messy → 1
  function cleanScale(s: SurveyScore): Profile["cleanliness"] {
    return clamp(Math.round(5 - (s - 0.5) * (4 / 1.5)), 1, 5) as Profile["cleanliness"];
  }

  // Score 0.5 = introvert → 1, Score 2.0 = extrovert → 5
  function socialScale(s: SurveyScore): Profile["socialEnergy"] {
    return clamp(Math.round(1 + (s - 0.5) * (4 / 1.5)), 1, 5) as Profile["socialEnergy"];
  }

  function sleepFromScore(s: SurveyScore): Profile["sleepSchedule"] {
    if (s <= 0.5) return "early";
    if (s <= 1.0) return "normal";
    if (s <= 1.5) return "night-owl";
    return "shift";
  }

  // Q7 already stores inverted score (high = hosts frequently)
  function guestsBehavior(s: SurveyScore): Profile["guestsFrequency"] {
    if (s >= 1.5) return "frequently";
    if (s >= 1.0) return "occasionally";
    return "rarely";
  }

  // Q8 non-standard: 0.5 = wants few guests, 2.0 = fine with many
  function guestsExpect(s: SurveyScore): Profile["prefGuestsFrequency"] {
    if (s >= 1.6) return "frequently";
    if (s >= 0.8) return "occasionally";
    return "rarely";
  }

  return {
    sleepSchedule:       sleepFromScore(scores.q5),
    cleanliness:         cleanScale(scores.q1),
    prefCleanliness:     cleanScale(scores.q2),
    socialEnergy:        socialScale(scores.q3),
    prefSocialEnergy:    socialScale(scores.q4),
    guestsFrequency:     guestsBehavior(scores.q7),
    prefGuestsFrequency: guestsExpect(scores.q8),
  };
}
