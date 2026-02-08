import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore has a 2048 byte limit per item.
// Supabase session tokens can exceed this.
// Solution: split large values into chunks and
// reassemble them on read. This is a common pattern
// used in production React Native + Supabase apps.

const CHUNK_SIZE = 1800; // stay safely under 2048

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }

    // Try reading as a single value first
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;

    // If not found, check if it was chunked
    const chunks: string[] = [];
    let index = 0;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${index}`);
      if (!chunk) break;
      chunks.push(chunk);
      index++;
    }

    return chunks.length > 0 ? chunks.join("") : null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }

    // Clear any previous chunks first
    let index = 0;
    while (true) {
      const existing = await SecureStore.getItemAsync(`${key}_chunk_${index}`);
      if (!existing) break;
      await SecureStore.deleteItemAsync(`${key}_chunk_${index}`);
      index++;
    }

    if (value.length <= CHUNK_SIZE) {
      // Small enough to store directly
      await SecureStore.setItemAsync(key, value);
    } else {
      // Split into chunks
      const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) || [];
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }
      // Remove the single-value key if it exists
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }

    // Remove single value
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}

    // Remove any chunks
    let index = 0;
    while (true) {
      try {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${index}`);
        if (!chunk) break;
        await SecureStore.deleteItemAsync(`${key}_chunk_${index}`);
        index++;
      } catch {
        break;
      }
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});