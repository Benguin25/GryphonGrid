import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadProfile } from "../../lib/db";
import { computeMatch } from "../../lib/mock";
import { Profile } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";

const RED = "#CC0000";

// ── helpers ────────────────────────────────────────────────────────────────────

function matchColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function label(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScaleBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <View style={bar.row}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={[bar.dot, i < value ? bar.filled : bar.empty]}
        />
      ))}
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

const FALLBACK_ME: Profile = {
  id: "me", firstName: "", program: "", bio: "",
  sleepSchedule: "normal", cleanliness: 3, prefCleanliness: 3,
  socialEnergy: 3, prefSocialEnergy: 3, guestsFrequency: "occasionally",
  prefGuestsFrequency: "occasionally", substanceEnv: "smoke-free",
  hasDog: false, hasCat: false, petAllergy: "none", openToPets: true,
  noiseTolerance: "moderate", leaseDuration: "8-months",
};

export default function ProfileScreen() {
  const { id, pendingDirection } = useLocalSearchParams<{ id: string, pendingDirection?: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [me, setMe] = useState<Profile>(FALLBACK_ME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      loadProfile(id),
      user ? loadProfile(user.uid) : Promise.resolve(null),
    ]).then(([p, myP]) => {
      setProfile(p);
      if (myP) setMe(myP);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Profile not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const score = computeMatch(me, profile);

  // Show the roommate request button if this is not the current user's own profile

  const showRoommateButton = user && profile.id !== user.uid && !pendingDirection;

  // Show accept/decline if this is a pending received request
  const showAcceptDecline = pendingDirection === 'received';

  function handleRoommateRequest() {
    // Placeholder: replace with actual request logic
    alert('Roommate request sent!');
  }

  function handleAccept() {
    // Placeholder: replace with actual accept logic
    alert('Request accepted!');
  }

  function handleDecline() {
    // Placeholder: replace with actual decline logic
    alert('Request declined.');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backChevron, { top: insets.top + 8 }]}
      >
        <FontAwesome name="chevron-left" size={16} color="#fff" />
      </Pressable>

      {/* Hero photo */}
      <View style={styles.heroContainer}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.heroPhoto} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <FontAwesome name="user" size={64} color="#bdc3ca" />
          </View>
        )}
        {/* Match badge */}
        <View style={[styles.matchBadge, { backgroundColor: matchColor(score) }]}>
          <Text style={styles.matchScore}>{score}%</Text>
          <Text style={styles.matchLabel}>match</Text>
        </View>
      </View>

      {/* Name + program */}
      <View style={styles.nameRow}>
        <Text style={styles.name}>
          {profile.firstName}{profile.age ? `, ${profile.age}` : ""}
        </Text>
        {profile.gender ? (
          <Text style={styles.gender}>{label(profile.gender)}</Text>
        ) : null}
      </View>
      <Text style={styles.program}>{profile.program}</Text>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Quick-info chips */}
      <View style={styles.chipRow}>
        <Chip icon="🌙" text={label(profile.sleepSchedule)} />
        <Chip icon="📅" text={label(profile.leaseDuration)} />
        {profile.moveInDate ? (
          <Chip icon="🗓️" text={`Move-in: ${profile.moveInDate}`} />
        ) : null}
        {(profile.budgetMin || profile.budgetMax) ? (
          <Chip
            icon="💰"
            text={
              profile.budgetMin && profile.budgetMax
                ? `$${profile.budgetMin}–$${profile.budgetMax}/mo`
                : profile.budgetMin
                ? `$${profile.budgetMin}+/mo`
                : `Up to $${profile.budgetMax}/mo`
            }
          />
        ) : null}
      </View>

      {/* Lifestyle */}
      <Section title="Lifestyle">
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Cleanliness</Text>
          <ScaleBar value={profile.cleanliness} />
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Social energy</Text>
          <ScaleBar value={profile.socialEnergy} />
        </View>
        <InfoRow icon="🎉" text={`Guests: ${label(profile.guestsFrequency)}`} />
        <InfoRow icon="🔇" text={`Noise: ${label(profile.noiseTolerance)}`} />
        <InfoRow icon="🚬" text={label(profile.substanceEnv)} />
      </Section>

      {/* Preferences */}
      <Section title="Looking For">
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Preferred cleanliness</Text>
          <ScaleBar value={profile.prefCleanliness} />
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Preferred social energy</Text>
          <ScaleBar value={profile.prefSocialEnergy} />
        </View>
        <InfoRow icon="🎊" text={`Guests: ${label(profile.prefGuestsFrequency)}`} />
      </Section>

      {/* Pets */}
      <Section title="Pets">
        <InfoRow icon="🐶" text={`Has dog: ${label(profile.hasDog)}`} />
        <InfoRow icon="🐱" text={`Has cat: ${label(profile.hasCat)}`} />
        <InfoRow icon="💊" text={`Allergies: ${label(profile.petAllergy)}`} />
        <InfoRow icon="✅" text={`Open to pets: ${label(profile.openToPets)}`} />
      </Section>

      {/* Instagram (only shown post-match) */}
      {profile.instagramHandle ? (
        <Section title="Contact">
          <InfoRow icon="📸" text={`@${profile.instagramHandle}`} />
        </Section>
      ) : null}
      {/* Roommate Request Button */}
      {showRoommateButton && (
        <Pressable style={styles.roommateBtn} onPress={handleRoommateRequest}>
          <Text style={styles.roommateBtnText}>Request as Roommate</Text>
        </Pressable>
      )}

      {/* Accept/Decline Buttons for Pending Received Requests */}
      {showAcceptDecline && (
        <View style={styles.acceptDeclineRow}>
          <Pressable style={styles.acceptBtn} onPress={handleAccept}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.declineBtn} onPress={handleDecline}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function Chip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────

const bar = StyleSheet.create({
  row:    { flexDirection: "row", gap: 4 },
  dot:    { width: 14, height: 14, borderRadius: 7 },
  filled: { backgroundColor: RED },
  empty:  { backgroundColor: "#e5e7eb" },
});

const styles = StyleSheet.create({
  roommateBtn: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roommateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  acceptDeclineRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  declineBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  container:  { flex: 1, backgroundColor: "#f5f5f7" },
  content:    { paddingHorizontal: 20, paddingTop: 0 },
  centered:   { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f7" },
  errorText:  { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  backBtn:    { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: RED, borderRadius: 8 },
  backBtnText:{ color: "#fff", fontWeight: "700" },

  backChevron: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroContainer:  { width: "100%", height: 300, marginBottom: 16 },
  heroPhoto:      { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder:{
    width: "100%", height: "100%",
    backgroundColor: "#e5e7eb",
    alignItems: "center", justifyContent: "center",
  },
  matchBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },
  matchScore: { fontSize: 20, fontWeight: "800", color: "#fff" },
  matchLabel: { fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: -2 },

  nameRow:  { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 2 },
  name:     { fontSize: 26, fontWeight: "800", color: "#111" },
  gender:   { fontSize: 14, color: "#6b7280" },
  program:  { fontSize: 14, fontWeight: "600", color: RED, marginBottom: 10 },
  bio:      { fontSize: 14, color: "#374151", lineHeight: 21, marginBottom: 16 },

  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip:     {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#374151" },

  section:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },

  scaleRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scaleLabel: { fontSize: 13, color: "#374151", flex: 1 },

  infoRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  infoIcon: { fontSize: 16, width: 24, textAlign: "center" },
  infoText: { fontSize: 13, color: "#374151", flex: 1 },
});
