# GryphonGrid — ALGO.md Implementation Changes

## Overview

This document describes every change made to implement the ALGO.md specification into GryphonGrid.
It covers three areas: updated data types, the new onboarding flow, and the new weighted-distance
matching algorithm. A fully worked example is included at the end.

---

## Files Changed

### 1. `lib/types.ts`

**What changed:**
- Added `SurveyScore` type — the set of all valid numeric answer scores across the 10 survey questions:
  `0.5 | 0.8 | 1.0 | 1.5 | 1.6 | 2.0`
  (0.8 and 1.6 are non-standard values used by Q8 per ALGO.md)
- Added `SurveyScores` type — an object with keys `q1`–`q10`, each holding a `SurveyScore`
- Added `CategoryKey` type — union of the five lifestyle category identifiers:
  `"cleanliness" | "socialEnergy" | "sleepSchedule" | "guests" | "lifestyle"`
- Added two optional fields to the `Profile` type:
  - `surveyScores?: SurveyScores` — stores the user's 10 behavioral survey answers
  - `categoryPriorities?: CategoryKey[]` — stores the user's ranked category order (index 0 = rank 1)

The legacy `Profile` fields (`sleepSchedule`, `cleanliness`, `socialEnergy`, etc.) are **kept** for
display-screen backward compatibility. New profiles derive these fields from survey scores during
the onboarding submit step.

---

### 2. `lib/mock.ts`

**What changed:**

#### New exports
- `PRIORITY_MULTIPLIERS` — the five rank multipliers: `[1.85, 1.55, 1.25, 0.95, 0.70]`
- `ALL_CATEGORIES` — the five `CategoryKey` values in default display order
- `deriveSurveyDisplayFields(scores)` — converts a completed `SurveyScores` object into the legacy
  numeric/enum display fields so that profile cards and detail screens continue to render correctly

#### Updated `computeMatch(a, b)`
The function now chooses between two paths:
- **New algorithm** — used when both profiles have `surveyScores` and `categoryPriorities`
- **Legacy algorithm** — penalty-deduction fallback for profiles without survey data (existing mock
  profiles still work without changes, and older Firestore docs are not broken)

#### Updated mock profiles
All 8 mock profiles now include `surveyScores` and `categoryPriorities` fields.
Survey answers were derived from each persona's existing description (e.g., Margret — always clean,
very introverted, early riser — has 0.5 across all 10 questions).

---

### 3. `app/onboarding.tsx`

**What changed:** Complete rewrite from 6 steps to 5 steps per ALGO.md.

| Step | Old content | New content |
|------|-------------|-------------|
| 1 | Basic info | Basic info (same fields) |
| 2 | Lifestyle sliders (sleep, substance, noise) | **Category priority ranking** (new) |
| 3 | Cleanliness + social energy scales | **10-question behavioral survey** (new) |
| 4 | Guests + pets | Hard filters (substance, pets, lease, budget) |
| 5 | Living intent (lease, budget) | Review + hobbies + deal breakers + Instagram |
| 6 | Hobbies, deal breakers, review, submit | *(merged into step 5)* |

**Step 2 — Priority ranking:**
Five category tiles displayed in a ranked list. Each tile shows its current rank number, the
corresponding priority multiplier (`×1.85` … `×0.70`), and Up/Down arrow buttons to reorder.
No external drag library required.

**Step 3 — Behavioral survey:**
One question displayed at a time with a 4-option A/B/C/D layout. Tapping an answer immediately
records the score and auto-advances to the next question (no confirm button). A progress bar
tracks position within the 10 questions. After question 10, the screen automatically advances to
step 4. Back navigation within the survey goes to the previous question.

**Submit logic:**
When the user taps "Create Profile", the onboarding:
1. Uploads the photo to Cloudinary if a local URI is present
2. Calls `deriveSurveyDisplayFields(surveyScores)` to compute the legacy numeric display fields
3. Saves a `Profile` document that includes **both** the new survey fields **and** the derived legacy
   fields, ensuring full backward compatibility with all existing display screens

---

### 4. `app/(tabs)/index.tsx` — No changes required

The `ProfileCard` component still reads `sleepSchedule`, `cleanliness`, and `socialEnergy` directly.
Because the onboarding submit now derives and saves these fields for every new user, existing
display logic continues to work without modification.

---

## Matching Algorithm — Detailed Specification

### Formula

For each of the five categories:

```
BehaviorDistance    = |Behavior_A − Behavior_B|

ExpectationDistance = (|Expectation_A − Behavior_B| + |Expectation_B − Behavior_A|) / 2

CategoryDistance    = ((BehaviorDistance + ExpectationDistance) / 2) × CombinedMultiplier

CombinedMultiplier  = (PriorityMultiplier_A + PriorityMultiplier_B) / 2
```

Then:

```
TotalDistance   = sum of all 5 CategoryDistances

Compatibility   = 100 − (TotalDistance / MaxDistance) × 100   [clamped 0–100]
```

Hard constraints (pet allergies, substance incompatibility) are computed separately
and subtracted as a flat penalty after the survey score is calculated.

### Why MaxDistance = 9.45

Each user ranks all 5 categories, so their multipliers always sum to:
`1.85 + 1.55 + 1.25 + 0.95 + 0.70 = 6.30`

The combined multipliers (average of both users) also sum to 6.30.
The maximum possible distance per question is `2.0 − 0.5 = 1.5`.
Therefore the maximum possible total distance is:

```
MaxDistance = MaxCategoryAvg × SumOfCombinedMultipliers
            = 1.5 × 6.30
            = 9.45
```

This constant holds regardless of how either user ranks their categories.

---

## Worked Example — Alex vs. Jordan

### Profiles

| Field | Alex | Jordan |
|-------|------|--------|
| Q1 (cleanliness behavior) | 0.5 — always clean | 1.0 — lived-in but presentable |
| Q2 (cleanliness expectation) | 0.5 — bothered by dishes | 1.0 — stuff on counters ok |
| Q3 (social behavior) | 1.0 — slow start, texts a friend later | 1.5 — out and about |
| Q4 (social expectation) | 1.5 — background talk helps focus | 1.5 — barely notices |
| Q5 (sleep behavior) | 1.0 — standard 8 am / 11 pm | 1.0 — standard 8 am / 11 pm |
| Q6 (sleep expectation) | 1.0 — bothered past midnight | 1.0 — bothered past midnight |
| Q7 (guests behavior) | 1.0 — happy to go, not a host | 1.5 — offers if no one else does |
| Q8 (guests expectation) | 2.0 — stressed by advance-schedulers | 2.0 — stressed by advance-schedulers |
| Q9 (lifestyle behavior) | 1.0 — playlist & candle | 1.5 — window open, street noise |
| Q10 (lifestyle expectation) | 1.0 — slightly bothered by smell | 1.5 — notice 5 min then forget |

| Priority ranking | Alex | Multiplier | Jordan | Multiplier |
|-----------------|------|-----------|--------|-----------|
| Rank 1 | Cleanliness | ×1.85 | Social Energy | ×1.85 |
| Rank 2 | Sleep Schedule | ×1.55 | Lifestyle | ×1.55 |
| Rank 3 | Guests | ×1.25 | Guests | ×1.25 |
| Rank 4 | Social Energy | ×0.95 | Sleep Schedule | ×0.95 |
| Rank 5 | Lifestyle | ×0.70 | Cleanliness | ×0.70 |

---

### Step-by-step Calculation

#### Cleanliness (Q1, Q2)
```
CombinedMultiplier  = (1.85 + 0.70) / 2 = 1.275

BehaviorDistance    = |0.5 − 1.0| = 0.50
ExpectationDistance = (|0.5 − 1.0| + |1.0 − 0.5|) / 2 = (0.5 + 0.5) / 2 = 0.50
CategoryAvg         = (0.50 + 0.50) / 2 = 0.50

CategoryDistance    = 0.50 × 1.275 = 0.6375
```

#### Social Energy (Q3, Q4)
```
CombinedMultiplier  = (0.95 + 1.85) / 2 = 1.40

BehaviorDistance    = |1.0 − 1.5| = 0.50
ExpectationDistance = (|1.5 − 1.5| + |1.5 − 1.0|) / 2 = (0.0 + 0.5) / 2 = 0.25
CategoryAvg         = (0.50 + 0.25) / 2 = 0.375

CategoryDistance    = 0.375 × 1.40 = 0.5250
```

#### Sleep Schedule (Q5, Q6)
```
CombinedMultiplier  = (1.55 + 0.95) / 2 = 1.25

BehaviorDistance    = |1.0 − 1.0| = 0.00
ExpectationDistance = (|1.0 − 1.0| + |1.0 − 1.0|) / 2 = 0.00
CategoryAvg         = (0.00 + 0.00) / 2 = 0.00

CategoryDistance    = 0.00 × 1.25 = 0.0000
```

#### Guests / Friends (Q7, Q8)
```
CombinedMultiplier  = (1.25 + 1.25) / 2 = 1.25

BehaviorDistance    = |1.0 − 1.5| = 0.50
ExpectationDistance = (|2.0 − 1.5| + |2.0 − 1.0|) / 2 = (0.5 + 1.0) / 2 = 0.75
CategoryAvg         = (0.50 + 0.75) / 2 = 0.625

CategoryDistance    = 0.625 × 1.25 = 0.7813
```

#### Lifestyle (Q9, Q10)
```
CombinedMultiplier  = (0.70 + 1.55) / 2 = 1.125

BehaviorDistance    = |1.0 − 1.5| = 0.50
ExpectationDistance = (|1.0 − 1.5| + |1.5 − 1.0|) / 2 = (0.5 + 0.5) / 2 = 0.50
CategoryAvg         = (0.50 + 0.50) / 2 = 0.50

CategoryDistance    = 0.50 × 1.125 = 0.5625
```

---

### Final Score

```
TotalDistance = 0.6375 + 0.5250 + 0.0000 + 0.7813 + 0.5625 = 2.5063

SurveyScore   = 100 − (2.5063 / 9.45) × 100
              = 100 − 26.52
              = 73.48%
```

**Hard penalties:**
- Alex is `smoke-free`, Jordan is `alcohol-ok` → no penalty (smoke-free permits alcohol)
- Neither has pets the other is allergic to → no penalty
- Hard penalty total = 0

```
FinalScore = round(73.48 − 0) = 73%
```

**Alex and Jordan are 73% compatible.**

---

### Why This Beats the Old Algorithm

The old algorithm was asymmetric (A vs B ≠ B vs A) and capped many deductions at fixed amounts
(e.g., cleanliness capped at −20) regardless of how much each user actually cared. The new
algorithm is **symmetric** and **priority-aware**: if Alex cares deeply about cleanliness (rank 1)
but Jordan does not (rank 5), the combined multiplier is `1.275` — still meaningful but not
double-weighted. If both users make cleanliness rank 1, the combined multiplier becomes `1.85`,
amplifying differences in the area that matters most to both people.

---

## Notes on `edit-profile.tsx`

The `edit-profile.tsx` screen (used to update an existing profile) is not yet migrated to the new
5-step design. It still collects the old legacy fields. Users who edit via that screen will retain
their old profile shape without survey scores, meaning the legacy algorithm will be used for their
matches. A future update should mirror the same 5-step structure from `onboarding.tsx`.
