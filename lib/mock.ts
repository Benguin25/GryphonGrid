import { Profile } from "./types";

export const MOCK_PROFILES: Profile[] = [
  {
    id: "alex",
    firstName: "Alex",
    age: 21,
    gender: "male",
    program: "Computer Science",
    bio: "3rd year CS student. Early riser, keep things tidy. Love hiking on weekends. Looking for a chill housemate.",
    photoUrl: "https://i.pravatar.cc/300?img=11",
    sleepSchedule: "early",
    cleanliness: 4,
    prefCleanliness: 3,
    socialEnergy: 3,
    prefSocialEnergy: 3,
    guestsFrequency: "occasionally",
    prefGuestsFrequency: "occasionally",
    substanceEnv: "smoke-free",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "moderate",
    leaseDuration: "8-months",
    moveInDate: "2026-05-01",
  },
  {
    id: "margret",
    firstName: "Margret",
    age: 23,
    gender: "female",
    program: "Biology",
    bio: "Quiet, calm, looking for a stable mid-term roommate situation. I have a cat named Biscuit.",
    photoUrl: "https://i.pravatar.cc/300?img=5",
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 4,
    socialEnergy: 2,
    prefSocialEnergy: 2,
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
  },
  {
    id: "jordan",
    firstName: "Jordan",
    age: 22,
    gender: "non-binary",
    program: "Co-op (Software)",
    bio: "On a 4-month work term. Social, but respectful of space. Big into cooking and board games.",
    photoUrl: "https://i.pravatar.cc/300?img=15",
    sleepSchedule: "normal",
    cleanliness: 3,
    prefCleanliness: 3,
    socialEnergy: 4,
    prefSocialEnergy: 3,
    guestsFrequency: "occasionally",
    prefGuestsFrequency: "occasionally",
    substanceEnv: "alcohol-ok",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: false,
    noiseTolerance: "moderate",
    leaseDuration: "4-months",
    moveInDate: "2026-05-05",
  },
  {
    id: "priya",
    firstName: "Priya",
    age: 24,
    gender: "female",
    program: "Engineering",
    bio: "Grad student, mostly home in the evenings. Very clean. Need a quiet space for studying. Allergic to dogs.",
    photoUrl: "https://i.pravatar.cc/300?img=47",
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 4,
    socialEnergy: 2,
    prefSocialEnergy: 2,
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
  },
  {
    id: "mike",
    firstName: "Mike",
    age: 20,
    gender: "male",
    program: "Business",
    bio: "1st year business. Super outgoing. I work some nights so my schedule varies. Dog owner, he's friendly.",
    photoUrl: "https://i.pravatar.cc/300?img=3",
    sleepSchedule: "shift",
    cleanliness: 2,
    prefCleanliness: 2,
    socialEnergy: 5,
    prefSocialEnergy: 4,
    guestsFrequency: "frequently",
    prefGuestsFrequency: "occasionally",
    substanceEnv: "420-friendly",
    hasDog: true,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "background-ok",
    leaseDuration: "8-months",
    moveInDate: "2026-05-01",
  },
  {
    id: "sophie",
    firstName: "Sophie",
    age: 22,
    gender: "female",
    program: "Arts & Design",
    bio: "Night owl by nature. I paint late, keep headphones on. Chill, tidy, and low drama.",
    photoUrl: "https://i.pravatar.cc/300?img=25",
    sleepSchedule: "night-owl",
    cleanliness: 4,
    prefCleanliness: 3,
    socialEnergy: 3,
    prefSocialEnergy: 3,
    guestsFrequency: "occasionally",
    prefGuestsFrequency: "rarely",
    substanceEnv: "alcohol-ok",
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    openToPets: true,
    noiseTolerance: "moderate",
    leaseDuration: "4-months",
    moveInDate: "2026-05-15",
  },
  {
    id: "liam",
    firstName: "Liam",
    age: 25,
    gender: "male",
    program: "Working (Finance)",
    bio: "Full-time analyst. Early to bed. Clean, quiet, and keep to myself mostly. Long-term stability preferred.",
    photoUrl: "https://i.pravatar.cc/300?img=8",
    sleepSchedule: "early",
    cleanliness: 5,
    prefCleanliness: 5,
    socialEnergy: 1,
    prefSocialEnergy: 2,
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
  },
  {
    id: "zara",
    firstName: "Zara",
    age: 21,
    gender: "female",
    program: "Nursing",
    bio: "Shift nurse so hours are weird but I'm respectful about noise. Clean and considerate. I have a small cat.",
    photoUrl: "https://i.pravatar.cc/300?img=44",
    sleepSchedule: "shift",
    cleanliness: 4,
    prefCleanliness: 4,
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
  },
];

export function computeMatch(a: Profile, b: Profile): number {
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
  if (a.prefGuestsFrequency !== b.guestsFrequency) {
    const gulf: Record<string, number> = { rarely: 0, occasionally: 1, frequently: 2 };
    score -= Math.abs((gulf[a.prefGuestsFrequency] ?? 1) - (gulf[b.guestsFrequency] ?? 1)) * 8;
  }

  // Substance mismatch (hard)
  if (a.substanceEnv === "no-substances" && b.substanceEnv !== "no-substances") score -= 20;
  if (a.substanceEnv === "smoke-free" && (b.substanceEnv === "420-friendly")) score -= 15;

  // Pet allergy (hard constraint)
  if (a.petAllergy === "dog" && b.hasDog) score -= 40;
  if (a.petAllergy === "cat" && b.hasCat) score -= 40;
  if (a.petAllergy === "both" && (b.hasDog || b.hasCat)) score -= 50;
  const bHasPets = b.hasDog || b.hasCat;
  if (!a.openToPets && bHasPets) score -= 25;

  return Math.max(0, Math.min(100, Math.round(score)));
}
