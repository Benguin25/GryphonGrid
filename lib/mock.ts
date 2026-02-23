import { Profile } from "./types";

export const MOCK_PROFILES: Profile[] = [
  {
    id: "ron",
    name: "Ron Javitz",
    bio: "Born and raised in Gainesville, Florida. Into outdoor sports, especially surfing and snorkeling.",
    cleanliness: 4,
    socialEnergy: 3,
    hasDog: false,
    hasCat: false,
    petAllergy: "none",
    schedule: "day",
    prefCleanliness: 4,
    prefSocialEnergy: 3,
    prefPetsOk: true,
    prefSchedule: "any",
  },
  {
    id: "margret",
    name: "Margret",
    bio: "Quiet, calm, looking for a stable mid-term roommate situation.",
    cleanliness: 5,
    socialEnergy: 2,
    hasDog: false,
    hasCat: true,
    petAllergy: "none",
    schedule: "day",
    prefCleanliness: 4,
    prefSocialEnergy: 2,
    prefPetsOk: true,
    prefSchedule: "day",
  },
];

export function computeMatch(a: Profile, b: Profile): number {
  let score = 100;

  // schedule mismatch penalty
  if (a.prefSchedule !== "any" && a.prefSchedule !== b.schedule) score -= 25;

  // cleanliness delta penalty
  score -= Math.min(20, Math.abs(a.prefCleanliness - b.cleanliness) * 5);

  // social energy delta penalty
  score -= Math.min(20, Math.abs(a.prefSocialEnergy - b.socialEnergy) * 5);

  // pet constraints
  const bHasPets = b.hasDog || b.hasCat;
  if (!a.prefPetsOk && bHasPets) score -= 30;

  // allergy constraints (simple)
  if (a.petAllergy === "dog" && b.hasDog) score -= 40;
  if (a.petAllergy === "cat" && b.hasCat) score -= 40;
  if (a.petAllergy === "both" && bHasPets) score -= 50;

  return Math.max(0, Math.min(100, Math.round(score)));
}
