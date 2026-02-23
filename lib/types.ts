export type Cleanliness = 1 | 2 | 3 | 4 | 5;
export type SocialEnergy = 1 | 2 | 3 | 4 | 5;

export type Profile = {
  id: string;
  name: string;
  age?: number;
  bio: string;
  photoUrl?: string;

  // About Me
  cleanliness: Cleanliness;
  socialEnergy: SocialEnergy;
  hasDog: boolean;
  hasCat: boolean;
  petAllergy: "none" | "dog" | "cat" | "both";
  schedule: "day" | "night" | "mixed";

  // Preferences
  prefCleanliness: Cleanliness;
  prefSocialEnergy: SocialEnergy;
  prefPetsOk: boolean;
  prefSchedule: "day" | "night" | "mixed" | "any";
};
