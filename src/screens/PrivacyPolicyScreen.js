import { ScrollView, StyleSheet, Text, View } from "react-native";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

export default function PrivacyPolicyScreen() {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const sections = language === "sw" ? [
    {
      title: "Taarifa Tunazokusanya",
      body: "Tunakusanya jina lako, nambari ya simu, anwani ya uwasilishaji, na eneo lako la GPS — kwa madhumuni ya kukufikishia oda yako peke yake.",
    },
    {
      title: "Jinsi Tunavyotumia Taarifa Zako",
      body: "Taarifa zako zinatumika kukufikishia oda yako kupitia WhatsApp na dereva wetu. Haziuzwi, hazisameheshwi wala hazishirikishwi na watu wa nje.",
    },
    {
      title: "Hifadhi ya Taarifa",
      body: "Taarifa zako znahifadhiwa ndani ya simu yako (AsyncStorage) peke yake. Hakuna seva ya nje inayohusika.",
    },
    {
      title: "Eneo la GPS",
      body: "Tunaomba ruhusa ya eneo ili kukusaidia kujaza anwani ya uwasilishaji kwa usahihi. Eneo haliwekwi wala kutumwa popote bila idhini yako.",
    },
    {
      title: "Haki Zako",
      body: "Unaweza kufuta taarifa zako wakati wowote kwa kwenda Wasifu → Futa Taarifa. Kwa maswali, piga simu: +255 757 808 854",
    },
  ] : [
    {
      title: "Information We Collect",
      body: "We collect your name, phone number, delivery address, and GPS location — solely for the purpose of delivering your order.",
    },
    {
      title: "How We Use Your Information",
      body: "Your information is used to deliver your order via WhatsApp and our delivery rider. It is never sold, rented, or shared with third parties.",
    },
    {
      title: "Data Storage",
      body: "Your information is stored locally on your device (AsyncStorage) only. No external server is involved.",
    },
    {
      title: "GPS Location",
      body: "We request location permission to help auto-fill your delivery address accurately. Your location is never stored or transmitted without your consent.",
    },
    {
      title: "Your Rights",
      body: "You can delete your data at any time by going to Profile → Clear Profile. For questions, call: +255 757 808 854",
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.title(t)}>{tr("privacyPolicy")}</Text>
      <Text style={styles.updated(t)}>
        {language === "sw" ? "Ilisasishwa: Juni 2026" : "Last updated: June 2026"}
      </Text>

      {sections.map((s, i) => (
        <View key={i} style={styles.section(t)}>
          <Text style={styles.sectionTitle(t)}>{s.title}</Text>
          <Text style={styles.sectionBody(t)}>{s.body}</Text>
        </View>
      ))}

      <View style={styles.footer(t)}>
        <Text style={styles.footerText(t)}>
          Matosa Online Shopping{"\n"}
          Barabara ya Matosa, Dar es Salaam{"\n"}
          +255 757 808 854
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, gap: 16 },
  title: (t) => ({ fontSize: 26, fontWeight: "800", color: t.colors.text, marginBottom: 4 }),
  updated: (t) => ({ fontSize: 12, color: t.colors.textMuted, marginBottom: 8 }),
  section: (t) => ({
    backgroundColor: t.colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: t.colors.border, gap: 6,
  }),
  sectionTitle: (t) => ({ fontSize: 15, fontWeight: "700", color: t.colors.text }),
  sectionBody: (t) => ({ fontSize: 14, color: t.colors.textMuted, lineHeight: 22 }),
  footer: (t) => ({
    backgroundColor: t.colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: t.colors.border, marginTop: 8,
  }),
  footerText: (t) => ({ fontSize: 13, color: t.colors.textMuted, lineHeight: 22, textAlign: "center" }),
});
