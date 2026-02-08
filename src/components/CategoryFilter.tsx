import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import { COLORS } from "../constants/colors";

// ============================================
// CATEGORY FILTER COMPONENT
// ============================================
// Horizontally scrollable chips for filtering
// transactions by category. "All" is the default.
//
// ScrollView with horizontal={true} creates the
// swipeable row — common pattern in mobile apps
// for filter bars (think Netflix genre row).

interface CategoryFilterProps {
  selected: string | null; // null means "All"
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({
  selected,
  onSelect,
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
      {DEFAULT_CATEGORIES.filter((c) => c.id !== "other").map((cat) => (
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