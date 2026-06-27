import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUIStore = create(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),

      language: "sw",
      setLanguage: (language) => set({ language }),

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "dark" ? "light" : state.mode === "light" ? "dark" : "dark",
        })),
    }),
    {
      name: "matosa_ui",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode, language: state.language }),
    }
  )
);

export default useUIStore;
