import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";


import useProfileStore from "../store/profileStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

export default function ProfileScreen({ navigation }) {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  // Profile store
  const savedName = useProfileStore((s) => s.name);
  const savedPhone = useProfileStore((s) => s.phone);
  const savedEmail = useProfileStore((s) => s.email);
  const savedAddress = useProfileStore((s) => s.address);
  const isSaved = useProfileStore((s) => s.isSaved);
  const setProfile = useProfileStore((s) => s.setProfile);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  // Hydrate profile from AsyncStorage on mount
  const hydrate = useProfileStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);

  // Local edit state
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(savedName);
  const [draftPhone, setDraftPhone] = useState(savedPhone);
  const [draftEmail, setDraftEmail] = useState(savedEmail);
  const [draftAddress, setDraftAddress] = useState(savedAddress);

  const startEdit = () => {
    setDraftName(savedName);
    setDraftPhone(savedPhone);
    setDraftEmail(savedEmail);
    setDraftAddress(savedAddress);
    setEditing(true);
  };

  const handleSave = () => {
    if (draftName.trim().length < 2) {
      Alert.alert("", tr("errName"));
      return;
    }
    if (draftPhone.replace(/\D/g, "").length < 9) {
      Alert.alert("", tr("errPhone"));
      return;
    }
    setProfile({
      name: draftName.trim(),
      phone: draftPhone.trim(),
      email: draftEmail.trim(),
      address: draftAddress.trim(),
    });
    setEditing(false);
    Alert.alert(tr("profileSaved"), tr("profileSavedMsg"));
  };

  const handleClear = () => {
    Alert.alert(tr("cancelOrder"), tr("cancelConfirm"), [
      { text: tr("no"), style: "cancel" },
      {
        text: tr("yesCancel"),
        style: "destructive",
        onPress: () => {
          clearProfile();
          setEditing(false);
        },
      },
    ]);
  };


  const Pill = ({ label, isActive, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill(t),
        isActive && styles.pillActive(t),
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillText(t), isActive && { color: "#FFF" }]}>
        {label}
      </Text>
    </Pressable>
  );



  const Field = ({ label, value, onChange, placeholder, keyboardType = "default", autoCapitalize = "words" }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel(t)}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editing}
        style={[
          styles.fieldInput(t),
          !editing && styles.fieldInputDisabled(t),
        ]}
      />
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      contentContainerStyle={styles.container}
    >
      {/* ── Profile Card ── */}
      <View style={styles.profileCard(t)}>
        <View style={styles.avatarWrap(t)}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.avatar}
          />
        </View>

        <View style={styles.profileMeta}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.name(t)} numberOfLines={1}>
              {savedName || tr("myProfile")}
            </Text>
            <View
              style={[
                styles.savedBadge,
                { backgroundColor: isSaved ? t.colors.primary + "20" : t.colors.border },
              ]}
            >
              <Ionicons
                name={isSaved ? "checkmark-circle" : "ellipse-outline"}
                size={12}
                color={isSaved ? t.colors.primary : t.colors.textMuted}
              />
              <Text
                style={[
                  styles.savedBadgeText,
                  { color: isSaved ? t.colors.primary : t.colors.textMuted },
                ]}
              >
                {isSaved ? tr("savedBadge") : tr("notSavedBadge")}
              </Text>
            </View>
          </View>
          <Text style={styles.meta(t)}>
            {savedPhone || tr("profileSub")}
          </Text>
        </View>
      </View>

      {/* ── Profile Info Form ── */}
      <View style={styles.sectionCard(t)}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle(t)}>{tr("myProfile")}</Text>
            <Text style={styles.sectionSub(t)}>{tr("profileSub")}</Text>
          </View>
          {!editing && (
            <Pressable
              onPress={startEdit}
              style={({ pressed }) => [
                styles.editBtn(t),
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="pencil-outline" size={16} color={t.colors.primary} />
              <Text style={styles.editBtnText(t)}>{tr("editProfile")}</Text>
            </Pressable>
          )}
        </View>

        <Field
          label={tr("fullName")}
          value={editing ? draftName : savedName}
          onChange={setDraftName}
          placeholder={tr("namePlaceholder")}
        />
        <Field
          label={tr("phoneNumber")}
          value={editing ? draftPhone : savedPhone}
          onChange={setDraftPhone}
          placeholder={tr("phonePlaceholder")}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <Field
          label={tr("emailAddress")}
          value={editing ? draftEmail : savedEmail}
          onChange={setDraftEmail}
          placeholder={tr("emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label={tr("deliveryAddress")}
          value={editing ? draftAddress : savedAddress}
          onChange={setDraftAddress}
          placeholder={tr("addressPlaceholder")}
        />

        {/* Hint box */}
        <View style={styles.hintBox(t)}>
          <Text style={styles.hintText(t)}>{tr("profileHint")}</Text>
        </View>

        {editing && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setEditing(false)}
              style={({ pressed }) => [
                styles.cancelBtn(t),
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelBtnText(t)}>{tr("no")}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn(t),
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="save-outline" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>{tr("saveProfile")}</Text>
            </Pressable>
          </View>
        )}

        {isSaved && !editing && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [styles.clearBtn(t), pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={14} color={t.colors.error ?? "#EF4444"} />
            <Text style={styles.clearBtnText}>{tr("cancel")} {tr("myProfile")}</Text>
          </Pressable>
        )}
      </View>

      {/* ── Language ── */}
      <View style={styles.sectionCard(t)}>
        <Text style={styles.sectionTitle(t)}>{tr("language")}</Text>
        <Text style={styles.sectionSub(t)}>{tr("chooseLanguage")}</Text>
        <View style={styles.pillRow}>
          <Pill label="Kiswahili" isActive={language === "sw"} onPress={() => setLanguage("sw")} />
          <Pill label="English" isActive={language === "en"} onPress={() => setLanguage("en")} />
        </View>
      </View>

      {/* ── Appearance ── */}
      <View style={styles.sectionCard(t)}>
        <Text style={styles.sectionTitle(t)}>{tr("appearance")}</Text>
        <Text style={styles.sectionSub(t)}>{tr("chooseTheme")}</Text>
        <View style={styles.pillRow}>
          <Pill label="System" isActive={mode === "system"} onPress={() => setMode("system")} />
          <Pill label="Light" isActive={mode === "light"} onPress={() => setMode("light")} />
          <Pill label="Dark" isActive={mode === "dark"} onPress={() => setMode("dark")} />
        </View>
      </View>


      {/* ── Admin Access ── */}
      <Pressable
        onPress={() => navigation.navigate("AdminDashboard")}
        style={({ pressed }) => [styles.sectionCard(t), { flexDirection: "row", alignItems: "center", gap: 14 }, pressed && styles.pressed]}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle(t)}>{tr("adminAccess")}</Text>
          <Text style={styles.sectionSub(t)}>{tr("adminAccessHint")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} />
      </Pressable>

      {/* ── Privacy Policy ── */}
      <Pressable
        onPress={() => navigation.navigate("PrivacyPolicy")}
        style={({ pressed }) => [styles.sectionCard(t), { flexDirection: "row", alignItems: "center", gap: 14 }, pressed && styles.pressed]}
      >
        <Ionicons name="document-text-outline" size={22} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle(t)}>{tr("privacyLink")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} />
      </Pressable>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.versionText(t)}>{tr("version")} 1.2.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },

  // Profile card at top
  profileCard: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    elevation: 4,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  }),
  avatarWrap: (t) => ({
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: t.colors.primary + "40",
    overflow: "hidden",
    backgroundColor: t.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  }),
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  profileMeta: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: (t) => ({
    ...t.typography.h3,
    color: t.colors.text,
    flexShrink: 1,
  }),
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  meta: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
    marginTop: 4,
  }),

  // Section card
  sectionCard: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
    elevation: 2,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  }),
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 12,
  },
  sectionTitle: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "700",
    color: t.colors.text,
    marginBottom: 4,
  }),
  sectionSub: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
    marginBottom: 20,
  }),

  // Edit button
  editBtn: (t) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.colors.primary + "50",
    backgroundColor: t.colors.primary + "15",
  }),
  editBtnText: (t) => ({
    fontSize: 13,
    fontWeight: "700",
    color: t.colors.primary,
  }),

  // Form fields
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: (t) => ({
    ...t.typography.caption,
    color: t.colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  }),
  fieldInput: (t) => ({
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: t.colors.text,
    fontSize: 15,
    backgroundColor: t.mode === "light" ? "#F9FAFB" : "#0D1311",
  }),
  fieldInputDisabled: (t) => ({
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#111A18",
    color: t.colors.text,
    opacity: 0.85,
  }),

  // Hint box
  hintBox: (t) => ({
    marginTop: 4,
    marginBottom: 16,
    padding: 12,
    backgroundColor: t.colors.primary + "12",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: t.colors.primary,
  }),
  hintText: (t) => ({
    ...t.typography.caption,
    color: t.colors.primary,
    lineHeight: 18,
    fontWeight: "600",
  }),

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  saveBtn: (t) => ({
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: t.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    elevation: 3,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }),
  saveBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  cancelBtn: (t) => ({
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421",
  }),
  cancelBtnText: (t) => ({
    fontWeight: "700",
    color: t.colors.textMuted,
    fontSize: 14,
  }),
  clearBtn: (t) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: t.mode === "light" ? "#FEF2F2" : "#2D1B1B",
  }),
  clearBtnText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 13,
  },

  // Pills
  pillRow: {
    flexDirection: "row",
    gap: 12,
  },
  pill: (t) => ({
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421",
    borderWidth: 1,
    borderColor: t.colors.border,
  }),
  pillActive: (t) => ({
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
  }),
  pillText: (t) => ({
    ...t.typography.bodySmall,
    fontWeight: "700",
    color: t.colors.text,
  }),

  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  versionText: (t) => ({
    ...t.typography.caption,
    color: t.colors.textMuted,
  }),
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
