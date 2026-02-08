import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================
// This file creates a single Supabase client instance
// that the entire app uses for auth and database operations.
//
// SecureStore adapter: By default, Supabase stores the
// user's auth token in localStorage (web). On mobile,
// we use expo-secure-store instead — it encrypts the
// token in the device's secure keychain, which is much
// safer than plain storage.

// ⚠️ REPLACE THESE with your actual Supabase project values
// from Settings → API in your Supabase dashboard
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter using expo-secure-store
// This tells Supabase to store auth tokens securely
// on the device instead of using localStorage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create and export the Supabase client
// This is a singleton — import it anywhere in the app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,       // auto-refresh expired tokens
    persistSession: true,          // keep user logged in across app restarts
    detectSessionInUrl: false,     // disable for React Native (web-only feature)
  },
});