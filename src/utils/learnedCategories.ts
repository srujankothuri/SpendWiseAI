import * as SecureStore from "expo-secure-store";

// ============================================
// LEARNED CATEGORIES (Layer 2)
// ============================================
// Stores user corrections to auto-categorization.
// When the engine gets a category wrong and the user
// manually picks the correct one, we save that mapping.
//
// Storage format (JSON in SecureStore):
// {
//   "panda express": "Food & Drink",
//   "venmo john": "Other",
//   "planet fitness": "Subscriptions"
// }
//
// The key is the lowercase description or merchant.
// The value is the category the user chose.
//
// This runs BEFORE the keyword engine, so user
// corrections always take priority.

const STORAGE_KEY = "learned_categories";

// In-memory cache so we don't hit SecureStore on every keystroke
let cache: Record<string, string> | null = null;

// Load learned mappings from storage into memory
async function loadCache(): Promise<Record<string, string>> {
  if (cache !== null) return cache;

  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    cache = stored ? JSON.parse(stored) : {};
  } catch {
    cache = {};
  }
  return cache;
}

// Save the cache back to storage
async function saveCache(): Promise<void> {
  try {
    if (cache) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error("Error saving learned categories:", error);
  }
}

// Learn from a user correction
// Called when user changes the auto-detected category
// before saving a transaction
export async function learnCategory(
  description: string,
  merchant: string,
  category: string
): Promise<void> {
  const mappings = await loadCache();

  // Store mapping for both description and merchant
  // so future matches work on either
  if (description.trim()) {
    mappings[description.toLowerCase().trim()] = category;
  }
  if (merchant.trim()) {
    mappings[merchant.toLowerCase().trim()] = category;
  }

  cache = mappings;
  await saveCache();
}

// Check if we have a learned category for this text
// Returns the category if found, null if not
export async function getLearnedCategory(
  text: string
): Promise<string | null> {
  const mappings = await loadCache();
  const lower = text.toLowerCase().trim();

  // Exact match first
  if (mappings[lower]) return mappings[lower];

  // Check if any learned key is contained in the text
  // This handles cases like "coffee at panda express"
  // matching the learned key "panda express"
  for (const [key, category] of Object.entries(mappings)) {
    if (lower.includes(key) || key.includes(lower)) {
      return category;
    }
  }

  return null;
}

// Get all learned mappings (useful for debugging/settings)
export async function getAllLearnedCategories(): Promise<
  Record<string, string>
> {
  return await loadCache();
}

// Clear all learned mappings (reset)
export async function clearLearnedCategories(): Promise<void> {
  cache = {};
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}