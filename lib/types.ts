export type Cleanliness = 1 | 2 | 3 | 4 | 5;
export type SocialEnergy = 1 | 2 | 3 | 4 | 5;
export type SleepSchedule = "early" | "normal" | "night-owl" | "shift";
export type GuestFrequency = "rarely" | "occasionally" | "frequently";
export type SubstanceEnv = "smoke-free" | "alcohol-ok" | "420-friendly" | "no-substances";
export type NoiseTolerance = "quiet" | "moderate" | "background-ok";
export type PetAllergy = "none" | "dog" | "cat" | "both";
export type LeaseDuration = "4-months" | "8-months" | "12-months" | "16-months" | "16-plus" | "indefinite";
export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

// ── Survey types (ALGO.md) ────────────────────────────────────────────────────

/** All valid survey answer scores. Q8 uses special values 0.8 and 1.6. */
export type SurveyScore = 0.5 | 0.8 | 1.0 | 1.5 | 1.6 | 2.0;

/**
 * Stores the numeric score for each of the 10 behavioral survey questions.
 * Questions 1-2 = Cleanliness, 3-4 = Social Energy, 5-6 = Sleep Schedule,
 * 7-8 = Guests/Friends, 9-10 = Lifestyle.
 */
export type SurveyScores = {
  q1: SurveyScore;  // Cleanliness — behavior
  q2: SurveyScore;  // Cleanliness — expectation
  q3: SurveyScore;  // Social Energy — behavior
  q4: SurveyScore;  // Social Energy — expectation
  q5: SurveyScore;  // Sleep Schedule — behavior
  q6: SurveyScore;  // Sleep Schedule — expectation
  q7: SurveyScore;  // Guests/Friends — behavior (inverted scoring)
  q8: SurveyScore;  // Guests/Friends — expectation (non-standard scoring)
  q9: SurveyScore;  // Lifestyle — behavior
  q10: SurveyScore; // Lifestyle — expectation
};

/** The five lifestyle categories used in priority ranking and matching. */
export type CategoryKey =
  | "cleanliness"
  | "socialEnergy"
  | "sleepSchedule"
  | "guests"
  | "lifestyle";

// ── Profile ───────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;

  // Section 1: Identity Basics
  firstName: string;
  age?: number;
  gender?: Gender;
  program: string;
  bio: string; // max 250 chars
  photoUrl?: string;

  // Section 2: Lifestyle (legacy display fields — derived from survey for new profiles)
  sleepSchedule: SleepSchedule;
  cleanliness: Cleanliness;
  prefCleanliness: Cleanliness;
  socialEnergy: SocialEnergy;
  prefSocialEnergy: SocialEnergy;
  guestsFrequency: GuestFrequency;
  prefGuestsFrequency: GuestFrequency;
  substanceEnv: SubstanceEnv;
  hasDog: boolean;
  hasCat: boolean;
  petAllergy: PetAllergy;
  openToPets: boolean;
  noiseTolerance: NoiseTolerance;

  // Section 3: Living Intent
  leaseDuration: LeaseDuration;
  moveInDate?: string; // "YYYY-MM-DD"
  budgetMin?: number;
  budgetMax?: number;

  // Section 4: Private (only revealed post-match)
  instagramHandle?: string;

  // Section 5: Hobbies & Deal Breakers
  hobbies?: string[];
  dealBreakers?: string[];

  // ── ALGO.md fields ──────────────────────────────────────────────────────────
  /** Scores for all 10 behavioral survey questions. */
  surveyScores?: SurveyScores;

  /**
   * Ordered list of 5 lifestyle categories from most to least important.
   * Index 0 = rank 1 (multiplier 1.85), index 4 = rank 5 (multiplier 0.70).
   */
  categoryPriorities?: CategoryKey[];
};

export type RequestStatus = "pending" | "accepted" | "declined";

export type RoommateRequest = {
  id: string;         // "${fromUid}_${toUid}"
  fromUid: string;
  toUid: string;
  fromName: string;   // snapshot so we can show name without a second read
  fromPhoto?: string;
  status: RequestStatus;
  createdAt: string;
};
