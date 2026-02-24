export type Cleanliness = 1 | 2 | 3 | 4 | 5;
export type SocialEnergy = 1 | 2 | 3 | 4 | 5;
export type SleepSchedule = "early" | "normal" | "night-owl" | "shift";
export type GuestFrequency = "rarely" | "occasionally" | "frequently";
export type SubstanceEnv = "smoke-free" | "alcohol-ok" | "420-friendly" | "no-substances";
export type NoiseTolerance = "quiet" | "moderate" | "background-ok";
export type PetAllergy = "none" | "dog" | "cat" | "both";
export type LeaseDuration = "4-months" | "8-months" | "12-months" | "16-months" | "16-plus" | "indefinite";
export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export type Profile = {
  id: string;

  // Section 1: Identity Basics
  firstName: string;
  age?: number;
  gender?: Gender;
  program: string;
  bio: string; // max 250 chars
  photoUrl?: string;

  // Section 2: Lifestyle
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
