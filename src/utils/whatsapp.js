import { Alert, Linking } from "react-native";

export const BUSINESS_WHATSAPP = "255757808854"; // TODO: replace with your WhatsApp number (no +, no spaces)

const encode = (s) => encodeURIComponent(String(s ?? ""));

const formatTZS = (n) => `${Number(n || 0).toLocaleString()} TZS`;

const formatDateTime = (ms) => {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

export function buildOrderMessage({
  orderId,
  createdAt,
  customer,
  cart,
  subtotalTZS,
  deliveryFeeTZS,
  totalTZS,
  paymentMethod,
  paymentRef,
}) {
  const lines = [];

  lines.push("CONFIRM");
  lines.push("--------------------------------");

  if (orderId) lines.push(`Order: ${orderId}`);
  if (createdAt) lines.push(`Time: ${formatDateTime(createdAt)}`);
  if (orderId || createdAt) lines.push("--------------------------------");

  lines.push(`Name: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);
  lines.push(`Address: ${customer.address}`);
  if (customer.mapsLink) lines.push(`Maps: ${customer.mapsLink}`);

  if (paymentMethod) {
    lines.push(`Payment: ${paymentMethod}${paymentRef ? ` (${paymentRef})` : ""}`);
  }

  lines.push("");
  lines.push("Items:");
  cart.forEach((i, idx) => {
    lines.push(
      `${idx + 1}. ${i.name}  x${i.quantity}  @ ${Number(i.price).toLocaleString()} = ${(i.price * i.quantity).toLocaleString()} TZS`,
    );
  });

  lines.push("");
  if (Number.isFinite(Number(subtotalTZS))) lines.push(`SUBTOTAL: ${formatTZS(subtotalTZS)}`);
  if (Number.isFinite(Number(deliveryFeeTZS)))
    lines.push(`DELIVERY: ${formatTZS(deliveryFeeTZS)}`);
  lines.push(`TOTAL: ${formatTZS(totalTZS)}`);
  lines.push("--------------------------------");
  lines.push("Please confirm availability + delivery fee (if any).");

  return lines.join("\n");
}

export async function openWhatsAppWithMessage({ phoneNumber, message }) {
  const number = String(phoneNumber || "").replace(/\D/g, "");
  const encoded = encode(message);
  
  // Try app scheme first (supports both WhatsApp and WhatsApp Business)
  const waUrl = `whatsapp://send?phone=${number}&text=${encoded}`;
  // Fallback to web link which usually redirects to the app anyway
  const webUrl = `https://wa.me/${number}?text=${encoded}`;

  try {
    // Attempt to open WhatsApp directly without pre-checking canOpenURL
    // which often returns false on Android 11+ due to package visibility rules
    await Linking.openURL(waUrl);
    return true;
  } catch (waError) {
    console.log("Direct WhatsApp scheme failed, trying web fallback:", waError);
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch (webError) {
      console.error("WhatsApp Link Error:", webError);
      Alert.alert(
        "WhatsApp not available",
        "Please install WhatsApp or WhatsApp Business to complete your order. You can also manually message " + phoneNumber,
      );
      return false;
    }
  }
}
