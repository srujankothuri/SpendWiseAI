import * as SecureStore from "expo-secure-store";
import { Category } from "../types";
import { DEFAULT_CATEGORIES } from "../constants/categories";

// ============================================
// CUSTOM CATEGORIES
// ============================================
// Users can create their own expense categories
// beyond the default 10. Custom categories are
// stored locally on the device via SecureStore.
//
// When the app needs all categories (for pickers,
// charts, auto-categorization), it merges the
// defaults with any custom ones.
//
// Custom categories support:
//   - Custom name
//   - Emoji icon selection
//   - Color selection
//   - Custom keywords for auto-categorization

const STORAGE_KEY = "custom_categories";

let cache: Category[] | null = null;

async function loadCache(): Promise<Category[]> {
  if (cache !== null) return cache;

  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    cache = stored ? JSON.parse(stored) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function saveCache(): Promise<void> {
  try {
    if (cache) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error("Error saving custom categories:", error);
  }
}

// Get all categories (defaults + custom)
// This is the function used everywhere in the app
export async function getAllCategories(): Promise<Category[]> {
  // Always reload from storage to get fresh data
  cache = null;
  const custom = await loadCache();
  const defaults = [...DEFAULT_CATEGORIES];
  const otherIdx = defaults.findIndex((c) => c.id === "other");
  defaults.splice(otherIdx, 0, ...custom);
  return defaults;
}

// Get only custom categories
export async function getCustomCategories(): Promise<Category[]> {
  // Always reload from storage to get fresh data
  cache = null;
  return await loadCache();
}

// Add a new custom category
export async function addCustomCategory(category: {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}): Promise<Category> {
  const categories = await loadCache();

  // Check for duplicate names
  const allCats = [...DEFAULT_CATEGORIES, ...categories];
  if (allCats.some((c) => c.name.toLowerCase() === category.name.toLowerCase())) {
    throw new Error("A category with this name already exists");
  }

  const newCategory: Category = {
    id: `custom_${Date.now()}`,
    name: category.name,
    icon: category.icon,
    color: category.color,
    keywords: category.keywords,
  };

  categories.push(newCategory);
  cache = categories;
  await saveCache();

  return newCategory;
}

// Delete a custom category
export async function deleteCustomCategory(id: string): Promise<void> {
  const categories = await loadCache();
  cache = categories.filter((c) => c.id !== id);
  await saveCache();
}

// Update a custom category
export async function updateCustomCategory(
  id: string,
  updates: Partial<Omit<Category, "id">>
): Promise<void> {
  const categories = await loadCache();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found");

  categories[idx] = { ...categories[idx], ...updates };
  cache = categories;
  await saveCache();
}

// Clear all custom categories
export async function clearCustomCategories(): Promise<void> {
  cache = [];
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}