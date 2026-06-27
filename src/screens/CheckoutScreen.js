import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import LocationPickerModal from "../components/LocationPickerModal";
import useCartStore from "../store/cartStore";
import useOrdersStore from "../store/ordersStore";
import useProfileStore from "../store/profileStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";
import {
  BUSINESS_WHATSAPP,
  buildOrderMessage,
  openWhatsAppWithMessage,
} from "../utils/whatsapp";

const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;

const parseMoney = (raw) => {
  const trimmed = String(raw ?? "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
};

export default function CheckoutScreen({ navigation }) {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const tr = useTranslation(language);

  const DELIVERY_OPTIONS = [
    { key: "free", label: "Free (within 1km of store)", feeTZS: 0 },
    { key: "zone", label: tr("standardDelivery"), feeTZS: 1000 },
  ];

  const PAYMENT_METHODS = [
    { key: "cash", label: tr("cashOnDelivery"), lipa: null },
    { key: "mpesa", label: tr("mpesa"), lipa: "23932992" },
    { key: "tigopesa", label: tr("tigopesa"), lipa: "23932992" },
    { key: "airtel", label: tr("airtelMoney"), lipa: "23932992" },
  ];

  const cart = useCartStore((s) => s.cart);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useOrdersStore((s) => s.addOrder);

  // Pre-fill from saved profile
  const savedName = useProfileStore((s) => s.name);
  const savedPhone = useProfileStore((s) => s.phone);
  const savedAddress = useProfileStore((s) => s.address);

  const subtotal = getTotal();

  const [name, setName] = useState(savedName || "");
  const [phone, setPhone] = useState(savedPhone || "");
  const [address, setAddress] = useState(savedAddress || "");
  const [mapsLink, setMapsLink] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");

  const [sending, setSending] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const setFieldError = (field, msg) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));

  const clearFieldError = (field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const validate = () => {
    const next = {};
    if (cart.length === 0) next.cart = tr("errCartEmpty");
    if (name.trim().length < 2) next.name = tr("errName");
    if (phone.replace(/\D/g, "").length < 9) next.phone = tr("errPhone");
    if (address.trim().length < 3) next.address = tr("errAddress");
    if (mapsLink.trim() && !/^https?:\/\//i.test(mapsLink.trim())) {
      next.mapsLink = tr("errMapLink");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const deliveryFee = useMemo(() => {
    const opt = DELIVERY_OPTIONS.find((o) => o.key === deliveryOption);
    return opt ? opt.feeTZS : 1000;
  }, [deliveryOption, language]);

  const total = subtotal + deliveryFee;

  const isValid = useMemo(() => {
    if (cart.length === 0) return false;
    if (name.trim().length < 2) return false;
    if (phone.replace(/\D/g, "").length < 9) return false;
    if (address.trim().length < 3) return false;
    return true;
  }, [cart.length, name, phone, address]);

  const goToShop = () => {
    const parent = navigation?.getParent?.();
    if (parent?.navigate) {
      parent.navigate("Shop");
      return;
    }
    navigation.navigate("Home");
  };

  const useMyLocation = async () => {
    try {
      setLocLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(tr("permissionNeeded"), tr("permissionMsg"));
        return;
      }

      let pos;
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        });
      } catch (e) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lon: longitude });

      const link = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
      setMapsLink(link);
      clearFieldError("mapsLink");

      if (Platform.OS === "web") {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          const data = await response.json();
          const guess = [data.locality, data.city, data.principalSubdivision]
            .filter(Boolean)
            .join(", ");

          if (guess) {
            setAddress((prev) => (prev.trim().length >= 3 ? prev : guess));
            clearFieldError("address");
          }
        } catch (e) {
          console.log("Web geocode failed:", e);
        }
      } else {
        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          if (geo?.length) {
            const g = geo[0];
            const guess = [g.name, g.street, g.city, g.subregion, g.region]
              .filter(Boolean)
              .join(", ");
            if (guess) {
              setAddress((prev) => (prev.trim().length >= 3 ? prev : guess));
              clearFieldError("address");
            }
          }
        } catch (e) {
          console.log("Reverse geocode failed:", e);
        }
      }

      Alert.alert(tr("locationAdded"), tr("locationAddedMsg"));
    } catch (e) {
      console.log("Location error:", e);
      Alert.alert(tr("locationError"), tr("locationErrorMsg"));
    } finally {
      setLocLoading(false);
    }
  };

  const sendOrder = async () => {
    if (cart.length === 0) {
      setFieldError("cart", tr("errCartEmpty"));
      Alert.alert(tr("errCartEmpty"), tr("errCartEmpty"));
      goToShop();
      return;
    }

    if (!validate()) {
      Alert.alert(tr("errFixRequired"), tr("errSomeDetails"));
      return;
    }

    if (!BUSINESS_WHATSAPP || BUSINESS_WHATSAPP.includes("X")) {
      Alert.alert(tr("errSetupRequired"), tr("errSetupMsg"));
      return;
    }

    const customer = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      mapsLink: mapsLink.trim(),
    };

    const createdAt = Date.now();

    const paymentLabel =
      PAYMENT_METHODS.find((p) => p.key === paymentMethod)?.label ??
      tr("cashOnDelivery");

    const orderId = addOrder({
      createdAt,
      customer,
      items: cart,
      subtotalTZS: subtotal,
      deliveryFeeTZS: deliveryFee,
      totalTZS: total,
      paymentMethod: paymentLabel,
      paymentRef: paymentRef.trim(),
      status: "new",
    });

    const message = buildOrderMessage({
      orderId,
      createdAt,
      customer,
      cart,
      subtotalTZS: subtotal,
      deliveryFeeTZS: deliveryFee,
      totalTZS: total,
      paymentMethod: paymentLabel,
      paymentRef: paymentRef.trim(),
    });

    try {
      setSending(true);
      const ok = await openWhatsAppWithMessage({
        phoneNumber: BUSINESS_WHATSAPP,
        message,
      });

      if (ok) {
        Alert.alert(tr("whatsappOpened"), tr("whatsappMsg"), [
          {
            text: tr("trackOrder"),
            onPress: () => {
              clearCart();
              navigation.navigate("OrderTracking", { orderId });
            },
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  const glass =
    t.mode === "light" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.35)";
  const glass2 =
    t.mode === "light" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.25)";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.panel(t), { backgroundColor: glass }]}>
        <Text style={styles.h1(t)}>{tr("deliveryDetails")}</Text>

        {errors.cart ? <Text style={styles.err}>{errors.cart}</Text> : null}

        <Text style={styles.label(t)}>{tr("fullName")}</Text>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            clearFieldError("name");
          }}
          placeholder={tr("namePlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          style={[styles.input(t), { backgroundColor: glass2 }]}
        />
        {errors.name ? <Text style={styles.err}>{errors.name}</Text> : null}

        <Text style={styles.label(t)}>{tr("phoneNumber")}</Text>
        <TextInput
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            clearFieldError("phone");
          }}
          placeholder={tr("phonePlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          keyboardType="phone-pad"
          style={[styles.input(t), { backgroundColor: glass2 }]}
        />
        {errors.phone ? <Text style={styles.err}>{errors.phone}</Text> : null}

        <Text style={styles.label(t)}>{tr("deliveryAddress")}</Text>
        <TextInput
          value={address}
          onChangeText={(v) => {
            setAddress(v);
            clearFieldError("address");
          }}
          placeholder={tr("addressPlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          style={[styles.input(t), { backgroundColor: glass2 }]}
        />
        {errors.address ? (
          <Text style={styles.err}>{errors.address}</Text>
        ) : null}

        <TextInput
          onChangeText={(v) => {
            setMapsLink(v);
            clearFieldError("mapsLink");
          }}
          placeholder={tr("mapLinkPlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          autoCapitalize="none"
          style={[styles.input(t), { backgroundColor: glass2 }]}
        />
        {errors.mapsLink ? (
          <Text style={styles.err}>{errors.mapsLink}</Text>
        ) : null}

        <View style={styles.locRow}>
          <Pressable
            onPress={useMyLocation}
            disabled={locLoading}
            style={({ pressed }) => [
              styles.locBtn(t),
              { backgroundColor: glass2 },
              locLoading ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons
              name="locate-outline"
              size={18}
              color={t.colors.primary}
            />
            <Text style={styles.locText(t)}>
              {locLoading ? tr("gettingLocation") : tr("useMyLocation")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowMapPicker(true)}
            style={({ pressed }) => [
              styles.locBtn(t),
              { backgroundColor: glass2 },
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons name="map-outline" size={18} color={t.colors.primary} />
            <Text style={styles.locText(t)}>{tr("pickOnMap")}</Text>
          </Pressable>
        </View>
      </View>

      <LocationPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        mode={mode}
        language={language}
        initialLocation={coords}
        onSelect={(res) => {
          setAddress(res.address);
          setMapsLink(res.mapsLink);
          setCoords(res.coords);
          clearFieldError("address");
          clearFieldError("mapsLink");
        }}
      />

      <View style={[styles.panel(t), { backgroundColor: glass }]}>
        <Text style={styles.h2(t)}>{tr("deliveryFeeTitle")}</Text>
        <Text style={styles.meta(t)}>{tr("deliveryFeeDesc")}</Text>

        <View style={styles.pillRow}>
          {DELIVERY_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => setDeliveryOption(o.key)}
              style={({ pressed }) => [
                styles.pill(t),
                { backgroundColor: glass2 },
                deliveryOption === o.key ? styles.pillActive(t) : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.pillText(t)}>{o.label}</Text>
              {o.key === "standard" ? (
                <Text style={styles.pillSub(t)}>{formatTZS(o.feeTZS)}</Text>
              ) : (
                <Text style={styles.pillSub(t)}>{tr("free")}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {deliveryOption === "free" ? (
          <View style={styles.infoBox(t)}>
            <Text style={styles.infoText(t)}>{tr("freeDeliveryNote")}</Text>
          </View>
        ) : null}

        <View style={styles.feeRow(t)}>
          <Text style={styles.feeLabel(t)}>{tr("deliveryFee")}</Text>
          <Text style={styles.feeValue(t)}>{formatTZS(deliveryFee)}</Text>
        </View>
      </View>

      <View style={[styles.panel(t), { backgroundColor: glass }]}>
        <Text style={styles.h2(t)}>{tr("orderSummary")}</Text>
        <View style={[styles.summary(t), { backgroundColor: glass2 }]}>
          {cart.map((i) => (
            <View key={i.id} style={styles.summaryRow(t)}>
              <Text style={styles.summaryName(t)} numberOfLines={1}>
                {i.name}
              </Text>
              <Text style={styles.summaryMeta(t)}>
                x{i.quantity} • {formatTZS(i.price * i.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow(t)}>
            <Text style={styles.totalLabel(t)}>{tr("subtotal")}</Text>
            <Text style={styles.totalValue(t)}>{formatTZS(subtotal)}</Text>
          </View>

          <View style={styles.totalRow(t)}>
            <Text style={styles.totalLabel(t)}>{tr("deliveryFee")}</Text>
            <Text style={styles.totalValue(t)}>{formatTZS(deliveryFee)}</Text>
          </View>

          <View style={styles.totalRow(t)}>
            <Text style={styles.totalLabel(t)}>{tr("total")}</Text>
            <Text style={styles.totalValue(t)}>{formatTZS(total)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.panel(t), { backgroundColor: glass }]}>
        <Text style={styles.h2(t)}>{tr("paymentMethod")}</Text>
        <Text style={styles.meta(t)}>{tr("paymentDesc")}</Text>

        <View style={styles.pillRow}>
          {PAYMENT_METHODS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => {
                setPaymentMethod(p.key);
                setPaymentRef("");
              }}
              style={({ pressed }) => [
                styles.pill(t),
                { backgroundColor: glass2 },
                paymentMethod === p.key ? styles.pillActive(t) : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.pillText(t)}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {(() => {
          const selected = PAYMENT_METHODS.find((p) => p.key === paymentMethod);
          if (!selected?.lipa) return null;
          return (
            <View style={styles.lipaBox(t)}>
              <Text style={styles.lipaTitle(t)}>
                {tr("lipaNumaLabel")}{" "}
                <Text style={{ color: t.colors.primary, fontWeight: "800" }}>
                  {selected.lipa}
                </Text>
              </Text>
              <Text style={styles.lipaSub(t)}>{tr("payFirstNote")}</Text>
              <Text style={[styles.label(t), { marginTop: 12 }]}>
                {tr("paymentRefLabel")}
              </Text>
              <TextInput
                value={paymentRef}
                onChangeText={setPaymentRef}
                placeholder={tr("paymentRefPlaceholder")}
                placeholderTextColor={t.colors.textMuted}
                autoCapitalize="characters"
                style={[styles.input(t), { backgroundColor: glass2 }]}
              />
              <Text style={styles.meta(t)}>{tr("paymentRefHint")}</Text>
            </View>
          );
        })()}

        <Pressable
          onPress={sendOrder}
          disabled={!isValid || sending}
          style={({ pressed }) => [
            styles.sendBtn(t),
            !isValid || sending ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.sendText}>
            {" "}
            {sending ? tr("sendingWhatsApp") : tr("sendOrderWhatsApp")}{" "}
          </Text>
        </Pressable>

        <Text style={styles.note(t)}>{tr("accuracyNote")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  panel: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
    elevation: 3,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  }),
  h1: (t) => ({
    ...t.typography.h3,
    color: t.colors.text,
    marginBottom: 4,
  }),
  h2: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "700",
    color: t.colors.text,
    marginTop: 8,
    marginBottom: 4,
  }),
  label: (t) => ({
    ...t.typography.caption,
    color: t.colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  }),
  input: (t) => ({
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: t.colors.text,
    fontSize: 16,
    backgroundColor: t.mode === "light" ? "#F9FAFB" : "#0D1311",
  }),
  err: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  meta: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  }),
  locRow: {
    flexDirection: "column",
    gap: 12,
  },
  locBtn: (t) => ({
    borderWidth: 1,
    borderColor: t.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    backgroundColor:
      t.mode === "light" ? t.colors.secondary : t.colors.secondary,
    flexDirection: "row",
    gap: 8,
  }),
  locText: (t) => ({
    fontWeight: "700",
    color: t.colors.primary,
    fontSize: 13,
  }),

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  pill: (t) => ({
    flexGrow: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421",
  }),
  pillActive: (t) => ({
    borderColor: t.colors.primary,
    borderWidth: 2,
    backgroundColor:
      t.mode === "light" ? t.colors.secondary : t.colors.secondary,
  }),
  pillText: (t) => ({
    fontWeight: "700",
    color: t.colors.text,
  }),
  pillSub: (t) => ({
    marginTop: 2,
    ...t.typography.caption,
    color: t.colors.textMuted,
  }),
  feeRow: (t) => ({
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  feeLabel: (t) => ({
    fontWeight: "700",
    color: t.colors.text,
  }),
  feeValue: (t) => ({
    fontWeight: "800",
    color: t.colors.primary,
    fontSize: 18,
  }),
  summary: (t) => ({
    borderRadius: 16,
    padding: 4,
    gap: 8,
  }),
  summaryRow: (t) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  }),
  summaryName: (t) => ({
    ...t.typography.bodySmall,
    fontWeight: "600",
    color: t.colors.text,
    flex: 1,
  }),
  summaryMeta: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
  }),
  totalRow: (t) => ({
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    marginTop: 8,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  }),
  totalLabel: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "700",
    color: t.colors.text,
  }),
  totalValue: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "800",
    color: t.colors.primary,
  }),
  sendBtn: (t) => ({
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: t.colors.primary,
    elevation: 4,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  }),
  sendText: {
    fontWeight: "800",
    color: "#FFF",
    fontSize: 16,
  },
  note: (t) => ({
    marginTop: 16,
    ...t.typography.caption,
    color: t.colors.textMuted,
    lineHeight: 18,
    textAlign: "center",
  }),
  disabled: {
    opacity: 0.6,
  },
  infoBox: (t) => ({
    backgroundColor: t.mode === "light" ? "#F0FDF4" : "#064E3B",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: t.colors.primary + "30",
  }),
  infoText: (t) => ({
    color: t.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  }),
  lipaBox: (t) => ({
    backgroundColor: t.mode === "light" ? "#F0FDF4" : "#064E3B",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: t.colors.primary + "40",
    gap: 4,
  }),
  lipaTitle: (t) => ({
    fontSize: 15,
    color: t.colors.text,
    fontWeight: "600",
  }),
  lipaSub: (t) => ({
    fontSize: 12,
    color: t.colors.textMuted,
    marginTop: 2,
  }),
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
