import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { vegetables as initialData } from "../data/vegetables";
import { sendLocalNotification } from "../utils/notifications";

const useProductsStore = create(
  persist(
    (set, get) => ({
      products: initialData,
      loading: false,
      lastSync: null,

      setProducts: (products) => set({ products }),

      toggleStock: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, inStock: !p.inStock } : p
          ),
        })),

      fetchProducts: async () => {
        set({ loading: true });
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          set({ lastSync: Date.now() });
        } catch (e) {
          console.error("Sync error:", e);
        } finally {
          set({ loading: false });
        }
      },

      onNewProductPushed: (newProduct) => {
        const { products } = get();
        if (!products.some((p) => p.id === newProduct.id)) {
          set({ products: [{ ...newProduct, inStock: true }, ...products] });
          sendLocalNotification("New Arrival! 🥬", `${newProduct.name} has been added to the store.`);
        }
      },
    }),
    {
      name: "matosa_products",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist stock state — images can't be serialized, so merge with initial data on rehydrate
      partialize: (state) => ({
        stockMap: Object.fromEntries(state.products.map((p) => [p.id, p.inStock])),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.stockMap) return;
        // Merge persisted stock flags back onto the static product list
        useProductsStore.setState((s) => ({
          products: s.products.map((p) => ({
            ...p,
            inStock: state.stockMap[p.id] ?? p.inStock,
          })),
        }));
      },
    }
  )
);

export default useProductsStore;
