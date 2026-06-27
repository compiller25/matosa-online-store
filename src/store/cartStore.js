import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const GREEN_VEG_PRICE = 600;
const GREEN_VEGETABLES = new Set([
  "Mchicha", "Tembele", "Mnavuu", "Figiri", "Chinnesse", "Majani ya Maboga",
]);

const resolvePrice = (item) => {
  if (!item) return 0;
  if (item.isGreen === true) return GREEN_VEG_PRICE;
  if (GREEN_VEGETABLES.has(item.name)) return GREEN_VEG_PRICE;
  return Number(item.price || 0);
};

const clampQty = (q) => {
  const n = Number(q);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
};

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item, quantity = 1) =>
        set((state) => {
          const qty = clampQty(quantity);
          const existing = state.cart.find((i) => i.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { cart: [...state.cart, { ...item, price: resolvePrice(item), quantity: qty }] };
        }),

      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),

      clearCart: () => set({ cart: [] }),

      increaseQty: (id, by = 1) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + clampQty(by) } : i
          ),
        })),

      decreaseQty: (id, by = 1) =>
        set((state) => ({
          cart: state.cart
            .map((i) => (i.id === id ? { ...i, quantity: i.quantity - clampQty(by) } : i))
            .filter((i) => i.quantity > 0),
        })),

      setQty: (id, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity: clampQty(quantity) } : i
          ),
        })),

      syncPrices: () =>
        set((state) => ({
          cart: state.cart.map((item) => ({ ...item, price: resolvePrice(item) })),
        })),

      getTotal: () =>
        get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "matosa_cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart }),
      onRehydrateStorage: () => (state) => {
        if (state) state.syncPrices();
      },
    }
  )
);

export default useCartStore;
