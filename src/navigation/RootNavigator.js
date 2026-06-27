import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, Text as RNText, View } from "react-native";

import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import HomeScreen from "../screens/HomeScreen";
import OrderTrackingScreen from "../screens/OrderTrackingScreen";
import OrdersScreen from "../screens/OrdersScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ProfileScreen from "../screens/ProfileScreen";

import useCartStore from "../store/cartStore";
import useUIStore from "../store/uiStore";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Shared language toggle button used in every stack header
function LangToggle({ language, setLanguage, t }) {
  return (
    <Pressable
      onPress={() => setLanguage(language === "sw" ? "en" : "sw")}
      style={{
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: t.colors.primary + "15",
        borderRadius: 20, borderWidth: 1,
        borderColor: t.colors.primary + "30",
        marginRight: 4,
      }}
    >
      <RNText style={{ color: t.colors.primary, fontWeight: "800", fontSize: 12 }}>
        {language === "sw" ? "EN" : "SW"}
      </RNText>
    </Pressable>
  );
}

// Shared stack screenOptions factory
const stackOpts = (t) => ({
  headerStyle: { backgroundColor: t.colors.bg },
  headerTintColor: t.colors.text,
  headerTitleStyle: { ...t.typography.h3 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: t.colors.bg },
});

const iconFor = (routeName, focused) => {
  const s = focused ? "" : "-outline";
  if (routeName === "ShopTab")    return `storefront${s}`;
  if (routeName === "CartTab")    return `cart${s}`;
  if (routeName === "OrdersTab")  return `receipt${s}`;
  if (routeName === "ProfileTab") return `person${s}`;
  return `apps${s}`;
};

const drawerIconFor = (routeName) => {
  if (routeName === "MainTabs")     return "home-outline";
  if (routeName === "CartDrawer")   return "cart-outline";
  if (routeName === "OrdersDrawer") return "receipt-outline";
  if (routeName === "SettingsDrawer") return "settings-outline";
  return "apps-outline";
};

function ShopStack({ t, i18n, language, setLanguage }) {
  const hdrRight = () => <LangToggle language={language} setLanguage={setLanguage} t={t} />;
  return (
    <Stack.Navigator screenOptions={{ ...stackOpts(t), headerRight: hdrRight }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Matosa Shopping",
          headerLeft: () => (
            <Image
              source={require("../../assets/icon.png")}
              style={{ width: 32, height: 32, marginRight: 12, borderRadius: 8 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: i18n("checkout") }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: i18n("trackOrder"), headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function CartStack({ t, i18n, language, setLanguage }) {
  const hdrRight = () => <LangToggle language={language} setLanguage={setLanguage} t={t} />;
  return (
    <Stack.Navigator screenOptions={{ ...stackOpts(t), headerRight: hdrRight }}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: i18n("cart") }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: i18n("checkout") }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: i18n("trackOrder"), headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function OrdersStack({ t, i18n, language, setLanguage }) {
  const hdrRight = () => <LangToggle language={language} setLanguage={setLanguage} t={t} />;
  return (
    <Stack.Navigator screenOptions={{ ...stackOpts(t), headerRight: hdrRight }}>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: i18n("orders") }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: i18n("trackOrder") }} />
    </Stack.Navigator>
  );
}

function ProfileStack({ t, i18n, language, setLanguage }) {
  const hdrRight = () => <LangToggle language={language} setLanguage={setLanguage} t={t} />;
  return (
    <Stack.Navigator screenOptions={{ ...stackOpts(t), headerRight: hdrRight }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: i18n("profile") }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: i18n("adminDashboard") }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: i18n("privacyPolicy") }} />
    </Stack.Navigator>
  );
}

function MainTabs({ t, i18n, language, setLanguage, cartCount }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size, color }) => (
          <Ionicons name={iconFor(route.name, focused)} size={size} color={color} />
        ),
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.card, borderTopColor: t.colors.border,
          height: 80, paddingTop: 10, paddingBottom: 25,
          elevation: 20, shadowColor: t.colors.shadow,
          shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
      })}
    >
      <Tab.Screen name="ShopTab" options={{ title: i18n("shop") }}>
        {() => <ShopStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
      </Tab.Screen>

      <Tab.Screen
        name="CartTab"
        options={{
          title: i18n("cart"),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: t.colors.primary, color: "#fff", fontWeight: "900", fontSize: 10 },
        }}
      >
        {() => <CartStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
      </Tab.Screen>

      <Tab.Screen name="OrdersTab" options={{ title: i18n("orders") }}>
        {() => <OrdersStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
      </Tab.Screen>

      <Tab.Screen name="ProfileTab" options={{ title: i18n("profile") }}>
        {() => <ProfileStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { t } = props;
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: t.colors.bg }} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={{
        padding: 24, backgroundColor: t.colors.primary, marginBottom: 8,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
      }}>
        <Image source={require("../../assets/icon.png")} style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 12 }} />
        <RNText style={{ color: "#FFF", fontSize: 20, fontWeight: "800" }}>Matosa Shopping</RNText>
        <RNText style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Online Grocery Store</RNText>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function RootNavigator() {
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const t = getTheme(mode);
  const i18n = useTranslation(language);
  const cartCount = useCartStore((s) => s.cart.reduce((sum, item) => sum + item.quantity, 0));

  const drawerOpts = {
    headerStyle: { backgroundColor: t.colors.bg },
    headerTintColor: t.colors.text,
    headerTitleStyle: { ...t.typography.h3 },
    headerShadowVisible: false,
    drawerStyle: { backgroundColor: t.colors.card, width: 280 },
    drawerActiveTintColor: t.colors.primary,
    drawerInactiveTintColor: t.colors.textMuted,
    drawerLabelStyle: { fontWeight: "700", fontSize: 14, marginLeft: -10 },
    drawerItemStyle: { borderRadius: 12, marginHorizontal: 12, marginVertical: 4 },
  };

  return (
    <NavigationContainer>
      <View style={[styles.app, { backgroundColor: t.colors.bg }]}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} t={t} />}
          screenOptions={({ route }) => ({
            ...drawerOpts,
            drawerIcon: ({ color, size }) => (
              <Ionicons name={drawerIconFor(route.name)} size={size} color={color} />
            ),
          })}
        >
          <Drawer.Screen name="MainTabs" options={{ title: i18n("shop"), headerShown: false }}>
            {() => <MainTabs t={t} i18n={i18n} language={language} setLanguage={setLanguage} cartCount={cartCount} />}
          </Drawer.Screen>

          <Drawer.Screen name="CartDrawer" options={{ title: i18n("cart") }}>
            {() => <CartStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
          </Drawer.Screen>

          <Drawer.Screen name="OrdersDrawer" options={{ title: i18n("orders") }}>
            {() => <OrdersStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
          </Drawer.Screen>

          <Drawer.Screen name="SettingsDrawer" options={{ title: i18n("profile") }}>
            {() => <ProfileStack t={t} i18n={i18n} language={language} setLanguage={setLanguage} />}
          </Drawer.Screen>
        </Drawer.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ app: { flex: 1 } });
