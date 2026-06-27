import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import useCartStore from "../store/cartStore";
import useProductsStore from "../store/productsStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const t = getTheme(mode);
  const i18n = useTranslation(language);

  const addToCart = useCartStore((s) => s.addToCart);


  const vegetables = useProductsStore((s) => s.products);
  const loading = useProductsStore((s) => s.loading);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, []);

  const cartCount = useCartStore((s) =>
    s.cart.reduce((sum, item) => sum + item.quantity, 0),
  );



  const [quantities, setQuantities] = useState({});
  const [clicked, setClicked] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = useMemo(() => {
    const keys = [...new Set(vegetables.map((v) => v.category).filter(Boolean))];
    return [{ key: null, labelKey: "category_all" }, ...keys.map((k) => ({ key: k, labelKey: `category_${k}` }))];
  }, [vegetables]);

  const data = useMemo(() => {
    let filtered = vegetables;
    if (selectedCategory) {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }
    if (search) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [vegetables, search, selectedCategory]);

  const setQty = (id, value) =>
    setQuantities((prev) => ({ ...prev, [id]: value }));

  const parseQty = (raw) => {
    const trimmed = String(raw ?? "").trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return null;
    const int = Math.floor(n);
    if (int < 1) return null;
    return int;
  };

  const handleAdd = (veg) => {
    if (!veg.inStock) return;
    const key = String(veg.id);
    let qty = 1;

    if (!veg.isGreen) {
      const raw = quantities[key];
      // If the field is not empty, validate and parse it
      if (raw !== undefined && raw.trim() !== "") {
        const parsed = parseQty(raw);
        if (parsed === null) {
          Alert.alert(i18n("invalidQty"), i18n("invalidQtyMsg"));
          return;
        }
        qty = parsed;
      }
    }

    addToCart(veg, qty);
    setClicked((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setClicked((prev) => ({ ...prev, [key]: false })), 700);
  };

  const numColumns = width > 1024 ? 4 : width > 768 ? 3 : width > 480 ? 2 : 2;
  const cardWidth = (width - t.spacing.md * (numColumns + 1)) / numColumns;

  const renderItem = ({ item }) => {
    const key = String(item.id);
    const isAdded = clicked[key] === true;
    const outOfStock = !item.inStock;

    return (
      <View style={[styles.card(t), { width: cardWidth }, outOfStock && { opacity: 0.55 }]}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
          {item.isGreen && !outOfStock && (
            <View style={styles.badge(t)}>
              <Text style={styles.badgeText(t)}>{i18n("freshBadge")}</Text>
            </View>
          )}
          {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>{i18n("outOfStock")}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.title(t)} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.price(t)}>
            {formatTZS(item.price)}
          </Text>

          {!item.isGreen ? (
            <TextInput
              value={quantities[key] ?? "1"}
              onChangeText={(v) => setQty(key, v)}
              keyboardType="number-pad"
              placeholder="Qty"
              placeholderTextColor={t.colors.textMuted}
              style={styles.qtyInput(t)}
              editable={!outOfStock}
            />
          ) : (
            <View style={{ height: 42 }} />
          )}

              <Pressable
                onPress={() => handleAdd(item)}
                disabled={outOfStock}
                style={({ pressed }) => [
                  styles.btn(t),
                  outOfStock && styles.btnOutOfStock(t),
                  clicked[item.id] && styles.btnAdded(t),
                  pressed && !outOfStock && styles.btnPressed,
                ]}
              >
                <Text style={styles.btnText(t)}>
                  {outOfStock ? i18n("outOfStock") : clicked[item.id] ? i18n("added") : i18n("addToCart")}
                </Text>
              </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container(t), { backgroundColor: t.colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.h1(t)}>{i18n("homeTitle")}</Text>
        <Text style={styles.subtitle(t)}>
          {i18n("homeSubtitle")}
        </Text>
      </View>

      <View style={styles.searchBar(t)}>
        <Ionicons name="search-outline" size={20} color={t.colors.textMuted} />
        <TextInput
          placeholder={i18n("searchPlaceholder")}
          placeholderTextColor={t.colors.textMuted}
          style={styles.searchInput(t)}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter chips */}
      <View style={styles.catContainer(t)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catContent}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key ?? "all"}
                onPress={() => setSelectedCategory(cat.key)}
                style={({ pressed }) => [
                  styles.catChip(t),
                  active && styles.catChipActive(t),
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.catChipText(t), active && styles.catChipTextActive]}>
                  {i18n(cat.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        key={`grid-${numColumns}`}
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={styles.colWrap}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyFilter}>
            <Text style={{ color: t.colors.textMuted, fontSize: 15 }}>{i18n("noResults")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: (t) => ({
    flex: 1,
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.md,
  }),
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  h1: (t) => ({
    ...t.typography.h2,
    color: t.colors.text,
  }),
  subtitle: (t) => ({
    ...t.typography.bodySmall,
    color: t.colors.textMuted,
  }),
  searchBar: (t) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: t.colors.border,
  }),
  searchInput: (t) => ({
    flex: 1,
    marginLeft: 12,
    color: t.colors.text,
    fontSize: 16,
  }),
  cartPill: (t) => ({
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: t.colors.primary,
    elevation: 4,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }),
  cartPillText: (t) => ({
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  }),
  listContent: {
    paddingBottom: 40,
  },
  colWrap: {
    justifyContent: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  card: (t) => ({
    backgroundColor: t.colors.card,
    borderRadius: 32,
    overflow: "hidden",
    elevation: 8,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: t.colors.border,
  }),
  imageContainer: {
    width: "100%",
    height: 250,
    position: "relative",
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: (t) => ({
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: t.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  }),
  badgeText: (t) => ({
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  }),
  cardContent: {
    padding: 16,
  },
  title: (t) => ({
    ...t.typography.h3,
    fontWeight: "700",
    color: t.colors.text,
    marginBottom: 8,
  }),
  price: (t) => ({
    ...t.typography.bodyLarge,
    fontWeight: "600",
    color: t.colors.primary,
    marginBottom: 16,
  }),
  qtyInput: (t) => ({
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.mode === "light" ? "#F3F4F6" : "#1A2421",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textAlign: "center",
    color: t.colors.text,
    marginBottom: 12,
    height: 40,
  }),
  btn: (t) => ({
    backgroundColor: t.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  }),
  btnAdded: (t) => ({
    backgroundColor: t.colors.success,
  }),
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  btnText: (t) => ({
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  }),
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnOutOfStock: (t) => ({
    backgroundColor: t.colors.textMuted,
  }),
  catContainer: (t) => ({
    marginBottom: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.mode === "light" ? "#F5F3EE" : "#161411",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: t.colors.border,
  }),
  catContent: {
    gap: 10,
  },
  catChip: (t) => ({
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: t.mode === "light" ? "#FFFFFF" : "#26221B",
    borderWidth: 1,
    borderColor: t.colors.border,
    elevation: 2,
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  }),
  catChipActive: (t) => ({
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 4,
  }),
  catChipText: (t) => ({
    fontSize: 14,
    fontWeight: "600",
    color: t.colors.text,
  }),
  catChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  emptyFilter: {
    paddingVertical: 60,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
