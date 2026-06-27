import { Ionicons } from "@expo/vector-icons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import useCartStore from "../store/cartStore";
import useOrdersStore from "../store/ordersStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";
import {
  BUSINESS_WHATSAPP,
  buildOrderMessage,
  openWhatsAppWithMessage,
} from "../utils/whatsapp";

const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;

const formatDateTime = (ms) => {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

export default function OrdersScreen({ navigation }) {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const orders = useOrdersStore((s) => s.orders);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const removeOrder = useOrdersStore((s) => s.removeOrder);
  const addToCart = useCartStore((s) => s.addToCart);

  const handleReorder = (order) => {
    (order.items ?? []).forEach((item) => addToCart(item, item.quantity));
    Alert.alert("✅", tr("reorderSuccess"));
  };

  const statusLabel = (s) => {
    if (s === "confirmed") return tr("statusConfirmed");
    if (s === "out_for_delivery") return tr("statusOutForDelivery");
    if (s === "delivered") return tr("statusDelivered");
    if (s === "canceled") return tr("statusCanceled");
    return tr("statusNew");
  };

  const handleCancel = (order) => {
    Alert.alert(
      tr("cancelOrder"),
      tr("cancelConfirm"),
      [
        { text: tr("no"), style: "cancel" },
        {
          text: tr("yesCancel"),
          style: "destructive",
          onPress: () => {
            updateStatus(order.id, "canceled");
            Alert.alert(tr("orderCanceled"), tr("orderCanceledMsg"));
          },
        },
      ]
    );
  };

  const messageAgain = async (order) => {
    if (!BUSINESS_WHATSAPP || BUSINESS_WHATSAPP.includes("X")) {
      Alert.alert(tr("errSetupRequired"), tr("errSetupMsg"));
      return;
    }

    const message = buildOrderMessage({
      orderId: order.id,
      createdAt: order.createdAt,
      customer: order.customer ?? {},
      cart: order.items ?? [],
      subtotalTZS: order.subtotalTZS,
      deliveryFeeTZS: order.deliveryFeeTZS,
      totalTZS: order.totalTZS,
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef,
    });

    await openWhatsAppWithMessage({
      phoneNumber: BUSINESS_WHATSAPP,
      message,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card(t)}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId(t)} numberOfLines={1}>
            {tr("orderHash")}{item.id.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.meta(t)}>{formatDateTime(item.createdAt)}</Text>
        </View>

        <View style={styles.statusPill(t, item.status)}>
          <Text style={styles.statusText(t, item.status)}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.summary(t)}>
        {(item.items ?? []).slice(0, 3).map((i) => (
          <View key={`${item.id}-${i.id}`} style={styles.lineRow}>
            <Text style={styles.lineName(t)} numberOfLines={1}>
              {i.name}
            </Text>
            <Text style={styles.lineMeta(t)}>
              x{i.quantity} • {formatTZS(i.price * i.quantity)}
            </Text>
          </View>
        ))}

        {(item.items ?? []).length > 3 ? (
          <Text style={styles.more(t)}>
            +{(item.items ?? []).length - 3} {tr("moreItems")}
          </Text>
        ) : null}

        <View style={styles.totalRow(t)}>
          <Text style={styles.totalLabel(t)}>{tr("total")}</Text>
          <Text style={styles.totalValue(t)}>{formatTZS(item.totalTZS)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}
          style={({ pressed }) => [
            styles.btn(t),
            { flex: 1.5, backgroundColor: t.colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.btnText}>{tr("trackOrder")}</Text>
        </Pressable>

        <Pressable
          onPress={() => messageAgain(item)}
          style={({ pressed }) => [
            styles.btn(t),
            { flex: 1, backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421", borderWidth: 1, borderColor: t.colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.btnText, { color: t.colors.text }]}>{tr("openWhatsApp")}</Text>
        </Pressable>

        {item.status !== "delivered" && item.status !== "canceled" && (
          <Pressable
            onPress={() => handleCancel(item)}
            style={({ pressed }) => [
              styles.cancelBtnMini(t),
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={18} color="#EF4444" />
          </Pressable>
        )}

        {(item.status === "delivered" || item.status === "canceled") && (
          <>
            <Pressable
              onPress={() => handleReorder(item)}
              style={({ pressed }) => [
                styles.btn(t),
                { flex: 1, backgroundColor: t.colors.success ?? "#16A34A" },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnText}>{tr("reorder")}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert(tr("deleteOrder"), tr("deleteOrderConfirm"), [
                  { text: tr("no"), style: "cancel" },
                  {
                    text: tr("yesDelete"),
                    style: "destructive",
                    onPress: () => removeOrder(item.id),
                  },
                ]);
              }}
              style={({ pressed }) => [
                styles.btn(t),
                { flex: 0.6, backgroundColor: "#EF4444" },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="trash-outline" size={18} color="#FFF" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle(t)}>{tr("noOrdersYet")}</Text>
          <Text style={styles.emptySub(t)}>{tr("noOrdersDesc")}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: (t) => ({
    ...t.typography.h3,
    color: t.colors.text,
    marginBottom: 8,
  }),
  emptySub: (t) => ({
    ...t.typography.body,
    color: t.colors.textMuted,
    textAlign: "center",
  }),

  card: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
    elevation: 5,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  }),
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "800",
    color: t.colors.text,
  }),
  meta: (t) => ({
    ...t.typography.caption,
    color: t.colors.textMuted,
    marginTop: 2,
  }),
  statusPill: (t, status) => ({
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor:
      status === "delivered" ? t.colors.success + "20" :
      status === "canceled" ? t.colors.error + "20" :
      t.colors.primary + "20",
  }),
  statusText: (t, status) => ({
    fontSize: 12,
    fontWeight: "700",
    color:
      status === "delivered" ? t.colors.success :
      status === "canceled" ? t.colors.error :
      t.colors.primary,
  }),

  summary: (t) => ({
    backgroundColor: t.mode === "light" ? "#F9FAFB" : "#0D1311",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  }),
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lineName: (t) => ({
    ...t.typography.bodySmall,
    fontWeight: "600",
    color: t.colors.text,
    flex: 1,
  }),
  lineMeta: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
  }),
  more: (t) => ({
    ...t.typography.caption,
    color: t.colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
  }),

  totalRow: (t) => ({
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  }),
  totalLabel: (t) => ({
    ...t.typography.bodySmall,
    fontWeight: "700",
    color: t.colors.text,
  }),
  totalValue: (t) => ({
    ...t.typography.bodySmall,
    fontWeight: "800",
    color: t.colors.primary,
  }),

  btn: (t) => ({
    backgroundColor: t.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  }),
  btnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtnMini: (t) => ({
    flex: 1,
    backgroundColor: t.mode === "light" ? "#FEF2F2" : "#2D1B1B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.mode === "light" ? "#FEE2E2" : "#4A1D1D",
  }),
  cancelBtnText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 14,
  },
});
