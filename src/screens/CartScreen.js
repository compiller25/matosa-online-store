import {
  Alert, FlatList, Pressable, StyleSheet, Text, View,
} from "react-native";

import useCartStore from "../store/cartStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;

export default function CartScreen({ navigation }) {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const cart = useCartStore((s) => s.cart);
  const getTotal = useCartStore((s) => s.getTotal);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = getTotal();

  const confirmClear = () => {
    Alert.alert(tr("clearCartTitle"), tr("clearCartMsg"), [
      { text: tr("cancel"), style: "cancel" },
      { text: tr("clearCart"), style: "destructive", onPress: clearCart },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row(t)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name(t)} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.meta(t)}>{item.quantity} × {formatTZS(item.price)}</Text>
      </View>
      <Pressable
        onPress={() => removeFromCart(item.id)}
        style={({ pressed }) => [styles.removeBtn(t), pressed && styles.pressed]}
      >
        <Text style={styles.removeText(t)}>{tr("remove")}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {cart.length === 0 ? (
        <View style={styles.emptyWrap(t)}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle(t)}>{tr("cartEmpty")}</Text>
          <Text style={styles.emptySub(t)}>{tr("cartEmptySub")}</Text>
          <Pressable
            style={[styles.checkoutBtn(t), { marginTop: 24, paddingHorizontal: 32 }]}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.checkoutText}>{tr("goShopping")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.footer(t)}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel(t)}>{tr("subtotal")}</Text>
              <Text style={styles.totalValue(t)}>{formatTZS(total)}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.clearBtn(t), pressed && styles.pressed]}
                onPress={confirmClear}
              >
                <Text style={styles.clearText(t)}>{tr("clearCartBtn")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.checkoutBtn(t), pressed && styles.pressed]}
                onPress={() => navigation.navigate("Checkout")}
              >
                <Text style={styles.checkoutText}>{tr("checkoutBtn")}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  emptyWrap: (t) => ({ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }),
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: (t) => ({ ...t.typography.h3, color: t.colors.text, marginBottom: 8 }),
  emptySub: (t) => ({ ...t.typography.body, color: t.colors.textMuted, textAlign: "center" }),
  row: (t) => ({
    flexDirection: "row", alignItems: "center", padding: 16,
    backgroundColor: t.colors.card, borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: t.colors.border,
    elevation: 4, shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  }),
  name: (t) => ({ ...t.typography.bodyLarge, fontWeight: "700", color: t.colors.text }),
  meta: (t) => ({ ...t.typography.bodySmall, color: t.colors.textMuted, marginTop: 2 }),
  removeBtn: (t) => ({
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: t.mode === "light" ? "#FEE2E2" : "#450A0A",
  }),
  removeText: (t) => ({ fontSize: 12, fontWeight: "700", color: t.colors.error }),
  footer: (t) => ({
    backgroundColor: t.colors.card, padding: 24,
    borderTopLeftRadius: 30, borderTopRightRadius: 30, marginHorizontal: -16,
    borderWidth: 1, borderColor: t.colors.border,
    elevation: 10, shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10,
  }),
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  totalLabel: (t) => ({ ...t.typography.bodyLarge, color: t.colors.textMuted }),
  totalValue: (t) => ({ ...t.typography.h2, color: t.colors.text }),
  actions: { flexDirection: "row", gap: 12 },
  clearBtn: (t) => ({
    flex: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: t.colors.border,
  }),
  checkoutBtn: (t) => ({
    flex: 2, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: t.colors.primary,
  }),
  clearText: (t) => ({ fontWeight: "700", color: t.colors.text }),
  checkoutText: { fontWeight: "700", color: "#FFFFFF", fontSize: 16 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
