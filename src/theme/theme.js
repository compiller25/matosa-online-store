import { Appearance, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const palette = {
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  gold: {
    50: "#FFFDF0",
    100: "#FEF9C3",
    200: "#FEF08A",
    300: "#FDE047",
    400: "#FACC15",
    500: "#EAB308",
    600: "#CA8A04",
    700: "#A16207",
    800: "#854D0E",
    900: "#713F12",
    accent: "#D4AF37",
    premium: "#B8860B",
  },
};

const light = {
  bg: "#FDFCF8",
  card: palette.white,
  text: palette.gray[900],
  textMuted: palette.gray[500],
  border: palette.gray[200],
  primary: palette.gold[700],
  secondary: palette.gold[100],
  accent: palette.gold.accent,
  success: "#2E7D32",
  error: "#D32F2F",
  shadow: "#000",
};

const dark = {
  bg: "#0C0B08",
  card: "#181612",
  text: palette.gray[50],
  textMuted: palette.gray[400],
  border: "#2A261F",
  primary: palette.gold[500],
  secondary: "#262118",
  accent: palette.gold.accent,
  success: "#43A047",
  error: "#E53935",
  shadow: "#000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: "800", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  bodyLarge: { fontSize: 18, fontWeight: "500", lineHeight: 26 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  button: { fontSize: 16, fontWeight: "600" },
};

export function getTheme(mode = "system") {
  const system = Appearance.getColorScheme();
  const resolved = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;

  return {
    mode: resolved,
    colors: resolved === "dark" ? dark : light,
    spacing,
    typography,
    screen: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      isSmall: SCREEN_WIDTH < 375,
      isLarge: SCREEN_WIDTH > 768,
    },
  };
}
