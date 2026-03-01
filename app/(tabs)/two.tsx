import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { loadProfile, deleteAccount } from "../../lib/db";
import { Profile } from "../../lib/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const RED = "#CC0000";

const SLEEP_LABELS: Record<string, string> = {
  early: "🌅 Early riser",
  normal: "🌤 Normal",
  "night-owl": "🌙 Night owl",
  shift: "🔄 Shift worker",
};
const GUESTS_LABELS: Record<string, string> = {
  rarely: "Rarely",
  occasionally: "Occasionally",
  frequently: "Frequently",
};
const SUBSTANCE_LABELS: Record<string, string> = {
  "smoke-free": "🚭 Smoke-free only",
  "alcohol-ok": "🍺 Alcohol okay",
  "420-friendly": "🌿 420 friendly",
  "no-substances": "✅ No substances",
};
const NOISE_LABELS: Record<string, string> = {
  quiet: "🤫 Needs quiet",
  moderate: "🎵 Moderate",
  "background-ok": "🔊 Background noise OK",
};
const LEASE_LABELS: Record<string, string> = {
  "4-months": "4 months",
  "8-months": "8 months",
  "12-months": "12 months",
  "16-months": "16 months",
  "16-plus": "16+ months",
  "indefinite": "Indefinite",
};
const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ScaleRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={[styles.dot, value >= n && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function MyProfileTab() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadProfile(user.uid).then(setProfile);
    }, [user?.uid])
  );

  function handleContactSupport() {
    Linking.openURL('mailto:benprobert25@gmail.com?subject=GryphonGrid%20Support').catch(() =>
      Alert.alert('Could not open email app.')
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This cannot be undone. All your profile data, matches, and requests will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account and all associated information will be deleted immediately.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    if (!user?.uid) return;
                    setDeletingAccount(true);
                    try {
                      await deleteAccount(user.uid);
                      // signOut is not needed — deleteUser also signs out
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      Alert.alert('Error', `Could not delete account: ${msg}`);
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  if (profile === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={RED} />
      </View>
    );
  }

  if (!profile || !profile.firstName) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyTitle}>No profile yet</Text>
        <Text style={styles.emptySub}>Complete onboarding to set up your profile.</Text>
        <Pressable style={styles.editBtn} onPress={() => router.push("/edit-profile")}>
          <Text style={styles.editBtnText}>Set up profile</Text>
        </Pressable>
      </View>
    );
  }

  const myPets = [
    profile.hasDog && "🐶 Dog",
    profile.hasCat && "🐱 Cat",
    !profile.hasDog && !profile.hasCat && "No pets",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Settings icon */}
      <Pressable
        style={styles.settingsIconBtn}
        onPress={() => setShowSettings(true)}
        hitSlop={12}
      >
        <FontAwesome name="cog" size={22} color="#6b7280" />
      </Pressable>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={settingsStyles.overlay} onPress={() => setShowSettings(false)}>
          <View style={settingsStyles.sheet}>
            <Text style={settingsStyles.title}>Settings</Text>

            <Pressable style={settingsStyles.item} onPress={() => { setShowSettings(false); handleContactSupport(); }}>
              <FontAwesome name="envelope" size={18} color="#374151" style={settingsStyles.icon} />
              <Text style={settingsStyles.itemText}>Contact Support</Text>
            </Pressable>

            <View style={settingsStyles.divider} />

            <Pressable style={settingsStyles.item} onPress={() => { setShowSettings(false); handleDeleteAccount(); }}>
              {deletingAccount
                ? <ActivityIndicator color="#dc2626" size="small" style={settingsStyles.icon} />
                : <FontAwesome name="trash" size={18} color="#dc2626" style={settingsStyles.icon} />
              }
              <Text style={[settingsStyles.itemText, { color: '#dc2626' }]}>
                {deletingAccount ? 'Deleting account…' : 'Delete Account'}
              </Text>
            </Pressable>

            <Pressable style={[settingsStyles.item, { marginTop: 8 }]} onPress={() => setShowSettings(false)}>
              <Text style={[settingsStyles.itemText, { color: '#9ca3af', textAlign: 'center', flex: 1 }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <Image
        source={{ uri: profile.photoUrl ?? `https://i.pravatar.cc/300?u=${profile.id}` }}
        style={styles.photo}
      />
      <Text style={styles.name}>
        {profile.firstName}{profile.age ? `, ${profile.age}` : ""}
      </Text>
      {profile.gender && (
        <Text style={styles.subtext}>{GENDER_LABELS[profile.gender] ?? profile.gender}</Text>
      )}
      <Text style={styles.program}>{profile.program}</Text>
      {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <Pressable style={styles.editBtn} onPress={() => router.push("/edit-profile")}>
        <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
      </Pressable>

      <Card title="Lifestyle">
        <InfoRow label="Sleep schedule" value={SLEEP_LABELS[profile.sleepSchedule]} />
        <InfoRow label="Substance environment" value={SUBSTANCE_LABELS[profile.substanceEnv]} />
        <InfoRow label="Noise tolerance" value={NOISE_LABELS[profile.noiseTolerance]} />
        <InfoRow label="Has guests" value={GUESTS_LABELS[profile.guestsFrequency]} />
      </Card>

      <Card title="My levels">
        <ScaleRow label="Cleanliness" value={profile.cleanliness} />
        <ScaleRow label="Social energy" value={profile.socialEnergy} />
      </Card>

      <Card title="Pets">
        <InfoRow label="My pets" value={myPets} />
        <InfoRow
          label="Pet allergies"
          value={profile.petAllergy === "none" ? "None" : `Allergic to ${profile.petAllergy}`}
        />
        <InfoRow label="Open to living with pets" value={profile.openToPets ? "Yes ✓" : "No"} />
      </Card>

      <Card title="Living Intent">
        <InfoRow label="Lease duration" value={LEASE_LABELS[profile.leaseDuration]} />
        {!!profile.moveInDate && (
          <InfoRow label="Move-in date" value={profile.moveInDate} />
        )}
        {(profile.budgetMin || profile.budgetMax) && (
          <InfoRow
            label="Budget"
            value={[
              profile.budgetMin && `$${profile.budgetMin}`,
              profile.budgetMax && `$${profile.budgetMax}`,
            ]
              .filter(Boolean)
              .join(" – ")}
          />
        )}
      </Card>

      {/* Hobbies */}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <Card title="Hobbies">
          <View style={styles.chipWrap}>
            {profile.hobbies.map((h) => (
              <View key={h} style={styles.hobbyChip}>
                <Text style={styles.hobbyChipText}>{h}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Deal Breakers */}
      {profile.dealBreakers && profile.dealBreakers.length > 0 && (
        <Card title="Deal Breakers">
          <View style={styles.chipWrap}>
            {profile.dealBreakers.map((d) => (
              <View key={d} style={styles.dealBreakerChip}>
                <Text style={styles.dealBreakerChipText}>{d}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.accountSection}>
        {user?.email ? (
          <Text style={styles.accountEmail}>Signed in as {user.email}</Text>
        ) : null}
        <Pressable
          style={styles.signOutBtn}
          onPress={() => signOut()}
        >
          <Text style={styles.signOutBtnText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  settingsIconBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  hobbyChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hobbyChipText: { fontSize: 11, color: '#4338ca', fontWeight: '600' },
  dealBreakerChip: {
    backgroundColor: '#FFF1F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  dealBreakerChipText: { fontSize: 11, color: '#be123c', fontWeight: '600' },
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 12,
  },
  name: { fontSize: 26, fontWeight: "800", textAlign: "center", color: "#111" },
  subtext: { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 2 },
  program: { fontSize: 15, color: RED, fontWeight: "600", textAlign: "center", marginTop: 4 },
  bio: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  editBtn: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#FFF0F0",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  editBtnText: { color: RED, fontSize: 14, fontWeight: "700" },
  accountSection: {
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  accountEmail: {
    fontSize: 12,
    color: "#9ca3af",
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  signOutBtnText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 13, color: "#111", fontWeight: "500", maxWidth: "55%", textAlign: "right" },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e5e7eb" },
  dotFilled: { backgroundColor: RED },
});

const settingsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
  },
  icon: { width: 24, textAlign: 'center' },
  itemText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },
});
