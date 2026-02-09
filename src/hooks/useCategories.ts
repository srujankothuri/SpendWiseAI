import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Category } from "../types";
import { getAllCategories } from "../utils/customCategories";

// ============================================
// useCategories HOOK
// ============================================
// Returns all categories (default + custom).
// Reloads every time the screen gains focus,
// so newly added custom categories show up
// immediately when navigating back.

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllCategories().then(setCategories);
    }, [])
  );

  return { categories };
}