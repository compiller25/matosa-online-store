import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { sendLocalNotification } from "../utils/notifications";

const makeOrderId = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36).slice(2, 6).toUpperCase()}`;

const clampMoney = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.round(x));
};

const normalizeItems = (items) =>
  Array.isArray(items)
    ? items.map((i) => ({
        id: i.id,
        name: i.name,
        price: clampMoney(i.price),
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
      }))
    : [];

const computeSubtotal = (items) =>
  normalizeItems(items).reduce((sum, i) => sum + i.price * i.quantity, 0);

const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (payload) => {
        const createdAt = payload?.createdAt ?? Date.now();
        const items = normalizeItems(payload?.items);
        const subtotalTZS = clampMoney(payload?.subtotalTZS ?? computeSubtotal(items));
        const deliveryFeeTZS = clampMoney(payload?.deliveryFeeTZS ?? 0);
        const totalTZS = clampMoney(payload?.totalTZS ?? subtotalTZS + deliveryFeeTZS);

        const order = {
          id: payload?.id ?? makeOrderId(),
          createdAt,
          status: payload?.status ?? "new",
          customer: payload?.customer ?? {},
          items,
          subtotalTZS,
          deliveryFeeTZS,
          totalTZS,
          paymentMethod: payload?.paymentMethod ?? "cash",
          paymentRef: payload?.paymentRef ?? "",
          notes: payload?.notes ?? "",
        };

        set((state) => ({ orders: [order, ...state.orders] }));

        sendLocalNotification(
          "Order Placed! 📦",
          `Your order #${order.id.slice(-6)} has been received and is waiting for confirmation.`
        );

        return order.id;
      },

      updateStatus: (orderId, status) => {
        if (!orderId) return;
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        }));

        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        const notifs = {
          confirmed: ["Order Confirmed! ✅", "The store has confirmed your order. We're picking the freshest items for you!"],
          out_for_delivery: ["Out for Delivery! 🚲", "Your veggies are on the way! Get ready for freshness."],
          delivered: ["Order Delivered! 🏠", "Enjoy your fresh vegetables! Thank you for shopping with us."],
          canceled: ["Order Canceled ❌", "Your order has been canceled successfully."],
        };

        const [title, body] = notifs[status] ?? ["Order Update", `Status: ${status}`];
        sendLocalNotification(title, body);
      },

      removeOrder: (orderId) =>
        set((state) => ({ orders: state.orders.filter((o) => o.id !== orderId) })),

      clearOrders: () => set({ orders: [] }),

      getOrderById: (orderId) => get().orders.find((o) => o.id === orderId),
    }),
    {
      name: "matosa_orders",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);

export default useOrdersStore;
