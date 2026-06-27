import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "sean_vegie_profile";

const useProfileStore = create((set, get) => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  isSaved: false,
  _hydrated: false,

  // Load from AsyncStorage on app start
  hydrate: async () => {
    if (get()._hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({ ...data, isSaved: true, _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },

  setProfile: async ({ name, phone, email, address }) => {
    const data = { name, phone, email, address };
    set({ ...data, isSaved: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log("Profile save error:", e);
    }
  },

  clearProfile: async () => {
    set({ name: "", phone: "", email: "", address: "", isSaved: false });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.log("Profile clear error:", e);
    }
  },
}));

export default useProfileStore;
