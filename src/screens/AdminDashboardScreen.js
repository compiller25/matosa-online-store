import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import useOrdersStore from "../store/ordersStore";
import useProductsStore from "../store/productsStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

const ADMIN_PIN = "1234";
const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;
const formatTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const STATUS_COLOR = {
  new: "#3B82F6", confirmed: "#10B981", out_for_delivery: "#F59E0B",
  delivered: "#16A34A", canceled: "#EF4444",
};

export default function AdminDashboardScreen() {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState("orders"); // orders | stock | summary

  const orders = useOrdersStore((s) => s.orders);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const products = useProductsStore((s) => s.products);
  const toggleStock = useProductsStore((s) => s.toggleStock);

  // Daily summary — orders placed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= todayStart.getTime());
  const todaySales = todayOrders
    .filter((o) => o.status !== "canceled")
    .reduce((sum, o) => sum + o.totalTZS, 0);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) { setUnlocked(true); setPin(""); }
    else { Alert.alert("❌", tr("adminPinWrong")); setPin(""); }
  };

  if (!unlocked) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.bg }]}>
        <Ionicons name="shield-checkmark-outline" size={56} color={t.colors.primary} />
        <Text style={styles.pinTitle(t)}>{tr("adminPinTitle")}</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder={tr("adminPinPlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          secureTextEntry
          keyboardType="number-pad"
          style={styles.pinInput(t)}
          onSubmitEditing={tryUnlock}
        />
        <Pressable onPress={tryUnlock} style={styles.unlockBtn(t)}>
          <Text style={styles.unlockText}>{tr("adminPinUnlock")}</Text>
        </Pressable>
      </View>
    );
  }

  const nextStatuses = (current) => {
    if (current === "new") return [{ key: "confirmed", label: tr("markConfirmed"), color: "#10B981" }, { key: "canceled", label: tr("markCanceled"), color: "#EF4444" }];
    if (current === "confirmed") return [{ key: "out_for_delivery", label: tr("markOutForDelivery"), color: "#F59E0B" }, { key: "canceled", label: tr("markCanceled"), color: "#EF4444" }];
    if (current === "out_for_delivery") return [{ key: "delivered", label: tr("markDelivered"), color: "#16A34A" }];
    return [];
  };

  const renderOrder = ({ item }) => {
    const actions = nextStatuses(item.status);
    return (
      <View style={styles.card(t)}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId(t)}>#{item.id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#999") + "20" }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? "#999" }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta(t)}>{item.customer?.name} • {item.customer?.phone}</Text>
        <Text style={styles.cardMeta(t)}>{item.customer?.address}</Text>
        <Text style={styles.cardMeta(t)}>{item.items?.length} items • {formatTZS(item.totalTZS)} • {item.paymentMethod}</Text>
        <Text style={[styles.cardMeta(t), { fontSize: 11 }]}>{formatTime(item.createdAt)}</Text>
        {actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => updateStatus(item.id, a.key)}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: a.color }, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.actionBtnText}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.stockRow(t)}>
      <Text style={styles.stockName(t)}>{item.name}</Text>
      <Pressable
        onPress={() => toggleStock(item.id)}
        style={[styles.stockToggle, { backgroundColor: item.inStock ? "#16A34A" : "#6B7280" }]}
      >
        <Text style={styles.stockToggleText}>{item.inStock ? tr("inStock") : tr("outOfStock")}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Tabs */}
      <View style={styles.tabBar(t)}>
        {[
          { key: "orders", icon: "receipt-outline", label: tr("adminOrders") },
          { key: "stock",  icon: "leaf-outline",    label: tr("adminStock") },
          { key: "summary",icon: "bar-chart-outline",label: tr("adminSummary") },
        ].map((tb) => (
          <Pressable
            key={tb.key}
            onPress={() => setTab(tb.key)}
            style={[styles.tabBtn(t), tab === tb.key && styles.tabBtnActive(t)]}
          >
            <Ionicons name={tb.icon} size={18} color={tab === tb.key ? t.colors.primary : t.colors.textMuted} />
            <Text style={[styles.tabLabel(t), tab === tb.key && { color: t.colors.primary }]}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "orders" && (
        orders.length === 0
          ? <View style={styles.center}><Text style={{ color: t.colors.textMuted }}>{tr("adminNoOrders")}</Text></View>
          : <FlatList
              data={orders}
              keyExtractor={(o) => o.id}
              renderItem={renderOrder}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            />
      )}

      {tab === "stock" && (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {tab === "summary" && (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={styles.summaryCard(t)}>
            <Text style={styles.summaryLabel(t)}>{tr("adminTotalOrders")}</Text>
            <Text style={styles.summaryValue(t)}>{todayOrders.length}</Text>
          </View>
          <View style={styles.summaryCard(t)}>
            <Text style={styles.summaryLabel(t)}>{tr("adminTotalSales")}</Text>
            <Text style={styles.summaryValue(t)}>{formatTZS(todaySales)}</Text>
          </View>
          {todayOrders.map((o) => (
            <View key={o.id} style={styles.card(t)}>
              <Text style={styles.orderId(t)}>#{o.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.cardMeta(t)}>{o.customer?.name} — {formatTZS(o.totalTZS)}</Text>
              <Text style={[styles.cardMeta(t), { color: STATUS_COLOR[o.status] ?? "#999" }]}>{o.status}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },

  pinTitle: (t) => ({ fontSize: 20, fontWeight: "700", color: t.colors.text, marginTop: 16 }),
  pinInput: (t) => ({
    width: "70%", borderWidth: 1, borderColor: t.colors.border, borderRadius: 14,
    padding: 14, color: t.colors.text, fontSize: 20, textAlign: "center",
    backgroundColor: t.colors.card, letterSpacing: 8,
  }),
  unlockBtn: (t) => ({
    backgroundColor: t.colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14,
  }),
  unlockText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

  tabBar: (t) => ({
    flexDirection: "row", backgroundColor: t.colors.card,
    borderBottomWidth: 1, borderBottomColor: t.colors.border,
  }),
  tabBtn: (t) => ({
    flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 4,
  }),
  tabBtnActive: (t) => ({ borderBottomWidth: 2, borderBottomColor: t.colors.primary }),
  tabLabel: (t) => ({ fontSize: 11, fontWeight: "600", color: t.colors.textMuted }),

  card: (t) => ({
    backgroundColor: t.colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: t.colors.border, gap: 4,
  }),
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  orderId: (t) => ({ fontWeight: "800", fontSize: 15, color: t.colors.text }),
  cardMeta: (t) => ({ fontSize: 13, color: t.colors.textMuted }),
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  stockRow: (t) => ({
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: t.colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: t.colors.border,
  }),
  stockName: (t) => ({ fontSize: 15, fontWeight: "600", color: t.colors.text }),
  stockToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  stockToggleText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  summaryCard: (t) => ({
    backgroundColor: t.colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: t.colors.border, alignItems: "center",
  }),
  summaryLabel: (t) => ({ fontSize: 13, color: t.colors.textMuted, fontWeight: "600", marginBottom: 8 }),
  summaryValue: (t) => ({ fontSize: 32, fontWeight: "800", color: t.colors.primary }),
});
