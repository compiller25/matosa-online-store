import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useOrdersStore from "../store/ordersStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";
import { BUSINESS_WHATSAPP, openWhatsAppWithMessage } from "../utils/whatsapp";

const STEPS = [
  { key: "new",              labelKey: "stepOrderPlaced",    icon: "receipt-outline" },
  { key: "confirmed",        labelKey: "stepConfirmed",       icon: "checkmark-circle-outline" },
  { key: "out_for_delivery", labelKey: "stepOutForDelivery",  icon: "bicycle-outline" },
  { key: "delivered",        labelKey: "stepDelivered",       icon: "home-outline" },
];

const STATUS_ORDER = ["new", "confirmed", "out_for_delivery", "delivered"];

const STATUS_COLOR = {
  new:              "#3B82F6",
  confirmed:        "#10B981",
  out_for_delivery: "#F59E0B",
  delivered:        "#10B981",
  canceled:         "#EF4444",
};

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const order = useOrdersStore((s) => s.getOrderById(orderId));

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.bg }]}>
        <Text style={{ color: t.colors.text, fontSize: 16, marginBottom: 20 }}>
          {tr("orderNotFound")}
        </Text>
        <Pressable style={styles.btn(t)} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.btnText}>{tr("goBackHome")}</Text>
        </Pressable>
      </View>
    );
  }

  const isCanceled = order.status === "canceled";
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const statusColor = STATUS_COLOR[order.status] ?? "#3B82F6";

  const handleWhatsApp = () =>
    openWhatsAppWithMessage({
      phoneNumber: BUSINESS_WHATSAPP,
      message: `Habari! Ninakagua oda yangu #${order.id}. Anwani yangu: ${order.customer?.address ?? ""}`,
    });

  const handleCall = () => Linking.openURL(`tel:${BUSINESS_WHATSAPP}`);

  const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;
  const formatDate = (ms) => new Date(ms).toLocaleString();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      contentContainerStyle={styles.container}
    >
      {/* Order header */}
      <View style={styles.headerCard(t)}>
        <Text style={styles.orderIdText(t)}>
          {tr("orderHash")}{order.id.slice(-6).toUpperCase()}
        </Text>
        <Text style={styles.dateText(t)}>{formatDate(order.createdAt)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {isCanceled ? tr("statusCanceled") : tr(STEPS[Math.max(0, currentIdx)]?.labelKey)}
          </Text>
        </View>
      </View>

      {/* Status timeline */}
      {isCanceled ? (
        <View style={styles.canceledBox(t)}>
          <Ionicons name="close-circle" size={40} color="#EF4444" />
          <Text style={styles.canceledText(t)}>{tr("statusCanceled")}</Text>
        </View>
      ) : (
        <View style={styles.timelineCard(t)}>
          {STEPS.map((step, idx) => {
            const done = currentIdx >= idx;
            const active = currentIdx === idx;
            const color = done ? t.colors.primary : t.colors.border;

            return (
              <View key={step.key} style={styles.stepRow}>
                {/* Connector line above (skip first) */}
                {idx > 0 && (
                  <View style={[styles.connector, { backgroundColor: currentIdx >= idx ? t.colors.primary : t.colors.border }]} />
                )}

                <View style={styles.stepContent}>
                  <View style={[
                    styles.stepIconCircle,
                    { backgroundColor: done ? t.colors.primary : t.colors.card, borderColor: color },
                    active && styles.stepIconActive,
                  ]}>
                    <Ionicons name={step.icon} size={20} color={done ? "#FFF" : t.colors.textMuted} />
                  </View>

                  <View style={styles.stepTextWrap}>
                    <Text style={[styles.stepLabel(t), done && { color: t.colors.text, fontWeight: "700" }]}>
                      {tr(step.labelKey)}
                    </Text>
                    {active && !isCanceled && (
                      <Text style={styles.stepActive(t)}>● {tr("inProgress")}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Delivery address */}
      {order.customer?.address ? (
        <View style={styles.infoCard(t)}>
          <Text style={styles.infoLabel(t)}>{tr("deliveryTo")}</Text>
          <Text style={styles.infoValue(t)}>{order.customer.address}</Text>
          {order.customer.mapsLink ? (
            <Pressable onPress={() => Linking.openURL(order.customer.mapsLink)} style={styles.mapLink(t)}>
              <Ionicons name="map-outline" size={14} color={t.colors.primary} />
              <Text style={styles.mapLinkText(t)}>{tr("viewOnMap")}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Order items summary */}
      <View style={styles.infoCard(t)}>
        <Text style={styles.infoLabel(t)}>{tr("items")}</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow(t)}>
            <Text style={styles.itemName(t)}>{item.name}</Text>
            <Text style={styles.itemMeta(t)}>x{item.quantity} • {formatTZS(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.totalRow(t)}>
          <Text style={styles.totalLabel(t)}>{tr("total")}</Text>
          <Text style={styles.totalValue(t)}>{formatTZS(order.totalTZS)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn(t), { backgroundColor: "#25D366" }, pressed && styles.pressed]}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>{tr("chatWithDriver")}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionBtn(t), { backgroundColor: t.colors.primary }, pressed && styles.pressed]}
          onPress={handleCall}
        >
          <Ionicons name="call-outline" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>{tr("callDriver")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },

  headerCard: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
    gap: 6,
  }),
  orderIdText: (t) => ({ fontSize: 22, fontWeight: "800", color: t.colors.text }),
  dateText: (t) => ({ fontSize: 13, color: t.colors.textMuted }),
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusBadgeText: { fontSize: 13, fontWeight: "700" },

  timelineCard: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
  }),

  stepRow: { position: "relative" },

  connector: {
    width: 2,
    height: 24,
    marginLeft: 23,
    marginVertical: 0,
  },

  stepContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },

  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconActive: {
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  stepTextWrap: { flex: 1 },
  stepLabel: (t) => ({ fontSize: 15, color: t.colors.textMuted, fontWeight: "500" }),
  stepActive: (t) => ({ fontSize: 12, color: t.colors.primary, fontWeight: "700", marginTop: 2 }),

  canceledBox: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  }),
  canceledText: (t) => ({ fontSize: 18, fontWeight: "700", color: "#EF4444" }),

  infoCard: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    gap: 8,
  }),
  infoLabel: (t) => ({ fontSize: 11, fontWeight: "700", color: t.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }),
  infoValue: (t) => ({ fontSize: 15, color: t.colors.text, fontWeight: "600" }),
  mapLink: (t) => ({ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }),
  mapLinkText: (t) => ({ fontSize: 13, color: t.colors.primary, fontWeight: "700" }),

  itemRow: (t) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  }),
  itemName: (t) => ({ fontSize: 14, color: t.colors.text, fontWeight: "600" }),
  itemMeta: (t) => ({ fontSize: 14, color: t.colors.textMuted }),
  totalRow: (t) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: t.colors.border,
  }),
  totalLabel: (t) => ({ fontSize: 15, fontWeight: "700", color: t.colors.text }),
  totalValue: (t) => ({ fontSize: 15, fontWeight: "800", color: t.colors.primary }),

  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: (t) => ({
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  }),
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  btn: (t) => ({ backgroundColor: t.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }),
  btnText: { color: "#FFF", fontWeight: "700" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
