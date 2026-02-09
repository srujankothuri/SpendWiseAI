import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Category } from "../types";
import { COLORS } from "../constants/colors";

// ============================================
// CATEGORY FILTER COMPONENT
// ============================================
// Now accepts categories as a prop so it works
// with both default and custom categories.

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  categories: Category[];
}

export default function CategoryFilter({
  selected,
  onSelect,
  categories,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {/* "All" chip */}
      <TouchableOpacity
        style={[
          styles.chip,
          selected === null && styles.chipActive,
        ]}
        onPress={() => onSelect(null)}
      >
        <Text
          style={[
            styles.chipText,
            selected === null && styles.chipTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Category chips */}
      {categories.filter((c) => c.id !== "other").map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.chip,
            selected === cat.name && {
              backgroundColor: cat.color,
              borderColor: cat.color,
            },
          ]}
          onPress={() =>
            onSelect(selected === cat.name ? null : cat.name)
          }
        >
          <Text
            style={[
              styles.chipText,
              selected === cat.name && styles.chipTextActive,
            ]}
          >
            {cat.icon} {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    minHeight: 44,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});