Copilot Prompt: GryphonGrid Onboarding + Matching System

We are redesigning the onboarding flow and roommate matching algorithm for GryphonGrid.

The goal is to collect structured behavioral data about users and compute a compatibility score using a weighted distance formula.

Follow the specifications below exactly.

Product Overview

GryphonGrid is a roommate matching platform.

Users complete a short onboarding flow that collects:

Basic profile information

Priority ranking of lifestyle categories

A 10-question behavioral survey

Hard filters (dealbreakers)

Final profile review

Profiles are then matched using a weighted compatibility algorithm.

Onboarding Flow
Page 1: Basic Profile Information

Collect the following fields:

Name

Profile photo

Occupation / program

School or workplace

Age

Bio (short text)

Gender (optional)

Move-in timeframe

This page just stores basic profile data.

Page 2: Category Priority Ranking

Users rank the five lifestyle categories from most important to least important.

Categories:

Cleanliness

Social Energy

Lifestyle

Sleep Schedule

Guests / Friends

Users should be able to drag and reorder these categories.

Store the final ranking order.

Example:

1 Cleanliness
2 Sleep Schedule
3 Guests
4 Lifestyle
5 Social Energy

Each rank maps to a priority multiplier used later in matching.

Priority multipliers:

1st priority = 1.85
2nd priority = 1.55
3rd priority = 1.25
4th priority = 0.95
5th priority = 0.70
Page 3: Behavioral Survey (10 Questions)

The user answers 10 multiple choice questions.

There is no confirm button per question.

Users should be able to quickly tap answers and move to the next question.

Each question belongs to one category and is labeled internally as either:

behavior

expectation

Each answer maps to a numeric score.

Standard score scale:

A = 0.5
B = 1.0
C = 1.5
D = 2.0

Exception: some questions invert the scoring if needed.

Survey Questions
Cleanliness

Q1 (behavior)

Your friend is crashing on your couch tonight with zero notice. You let them in. What do they walk into?

A) A clean space it pretty much always looks like this
score = 0.5

B) Lived in but presentable nothing embarrassing
score = 1.0

C) I'd be doing a quick scramble tidy while they're taking their shoes off
score = 1.5

D) A genuine mess I'd warn them in advance honestly
score = 2.0

Q2 (expectation)

You're scrolling through apartments online and one listing catches your eye great price, great location. Then you see the photos of the current tenant's space. Which version kills the vibe for you?

A) Dishes stacked in the sink in the listing photos
score = 0.5

B) Stuff piled on every counter but the floor is clear
score = 1.0

C) Visibly dusty shelves and fingerprint-smudged surfaces
score = 1.5

D) None of it I'm renting the bones of the apartment, not their lifestyle
score = 2.0

Social Energy

Q3 (behavior)

It’s a rare Saturday with zero obligations. How do you spend the first 4 hours of your day?

A) Totally solo, reading, gaming, or a walk; I need silence to "reset."
score = 0.5

B) Slow start at home, but I’ll probably text a friend to see what they’re doing later.
score = 1.0

C) Out and about, I’d rather grab a coffee with someone than sit at home.
score = 1.5

D) I’m probably hosting a group or at a busy event; I feel best when I’m around people.
score = 2.0

Q4 (expectation)

You are at a quiet cafe. A stranger sits at the table next to you and starts a quiet phone call. What is your internal reaction?

A) It’s a major distraction; I find it hard to focus on my own tasks once someone else is talking.
score = 0.5

B) A little annoying, but I’ll put on headphones and it won't bother me after a minute.
score = 1.0

C) I barely notice; the sound of background talking actually helps me focus.
score = 1.5

D) I find it interesting; I might even listen in or find the "life" in the room comforting.
score = 2.0

Sleep Schedule

Q5 (behavior)

If you were living alone on a desert island with no clocks, what time would your body naturally wake up and go to sleep?

A) Wake with the sun (6am), asleep shortly after dark (9pm-10pm).
score = 0.5

B) A standard 8am wake-up and an 11pm bedtime.
score = 1.0

C) Wake up late morning (10am), asleep in the early hours (1am-2am).
score = 1.5

D) I am a total night creature; I’d likely be up until 4am and sleep through the day.
score = 2.0

Q6 (expectation)

You are staying at a hotel and can hear the muffled sound of a TV from the room next door. At what point does this become a problem?

A) Any time after 9:00 PM; I need near-silence to feel like my day has ended.
score = 0.5

B) If it’s still going past midnight, it would bother my sleep.
score = 1.0

C) As long as it’s just a muffle and not a shout, I can sleep through anything.
score = 1.5

D) I actually find white noise or distant TV sounds helpful for falling asleep.
score = 2.0

Guests / Friends

Q7 (behavior)

Your friend group is figuring out where to watch the game this weekend. What role do you usually play in that conversation?

A) "Come to mine" I like hosting, my place is always open
score = 2.0

B) I'd offer if no one else does, but I'm not the first to suggest it
score = 1.5

C) Happy to go wherever, just not really a host person
score = 1.0

D) I'd rather go to a bar or someone else's I keep my space pretty personal
score = 0.5

Q8 (expectation)

You're casting a reality show about living situations. Which character would stress you out most as a roommate?

A) The one whose friends treat the apartment like their second home
score = 0.5

B) The one who disappears for weeks then reappears with a suitcase full of people
score = 0.8

C) The one who never has anyone over and makes you feel guilty for it
score = 1.6

D) The one who schedules every social interaction two weeks in advance
score = 2.0

Lifestyle

Q9 (behavior)

You are focused on a task (like a book or a game). What is your preferred "ambient" environment?

A) Total sensory blackout, no background music, neutral lighting, and no scents.
score = 0.5

B) Very controlled, a specific playlist and perhaps a scented candle I chose.
score = 1.0

C) Normal activity,the window open, some street noise, and whatever smells are in the air.
score = 1.5

D) High intensity, TV on in the background, bright lights, and high activity.
score = 2.0

Q10 (expectation)

You check into an AirBnB and notice a faint, lingering smell of the previous guest's cooking (like garlic or spices). How does this affect your stay?

A) I’d find it very difficult to relax until the smell was completely gone.
score = 0.5

B) I’d be slightly bothered and would probably open all the windows to reset the air.
score = 1.0

C) I’d notice it for the first five minutes and then forget it exists.
score = 1.5

D) I wouldn't notice it at all unless someone else pointed it out to me.
score = 2.0

Page 4: Hard Filters

These are dealbreakers and should exclude users before matching is calculated.

Collect:

Budget range

Smoking preference

Pets

Location preference

Move-in date

If users fail hard filter compatibility, they should not appear in each other's match list.

Page 5: Review and Create Profile

Display a summary of:

Basic profile info

Category priorities

Survey responses

Hard filters

User confirms and creates profile.

Matching Algorithm

Matching uses a weighted distance formula.

For each category:

Behavior distance:

|Behavior_A − Behavior_B|

Expectation distance:

(|Expectation_A − Behavior_B| + |Expectation_B − Behavior_A|) / 2

Category distance:

((BehaviorDistance + ExpectationDistance) / 2)
× PriorityMultiplier

Total distance:

Sum of all category distances

Convert to compatibility percentage:

Compatibility = 100 − (TotalDistance / MaxDistance) × 100

Clamp values between 0 and 100.

Higher percentage = better roommate match.