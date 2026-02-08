import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import { COLORS } from "../constants/colors";
import { formatCurrency } from "../utils/date";

// ============================================
// BUDGET PROGRESS CARD
// ============================================
// Shows a category budget with a visual progress bar.
// Color changes based on spending:
//   - Green: under 60% (safe)
//   - Orange/Warning: 60-90% (careful)
//   - Red/Danger: 90%+ (over or near limit)
//
// The progress bar width is calculated as a percentage
// of the container width using flex. This is more
// performant than calculating pixel widths.

interface BudgetProgressCardProps {
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BudgetProgressCard({
  category,
  monthlyLimit,
  spent,
  remaining,
  percentage,
  onEdit,
  onDelete,
}: BudgetProgressCardProps) {
  const categoryConfig = DEFAULT_CATEGORIES.find(
    (c) => c.name === category
  ) || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];

  // Determine color based on spending percentage
  const getProgressColor = () => {
    if (percentage >= 90) return COLORS.danger;
    if (percentage >= 60) return COLORS.warning;
    return COLORS.success;
  };

  // Status text changes based on spending
  const getStatusText = () => {
    if (percentage >= 100) return "Over budget!";
    if (percentage >= 90) return "Almost at limit!";
    if (percentage >= 60) return "Getting close";
    return "On track";
  };

  const handleLongPress = () => {
    Alert.alert(
      `${category} Budget`,
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Edit", onPress: onEdit },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  // Cap the visual bar at 100% even if overspent
  const barWidth = Math.min(percentage, 100);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onEdit}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Top row: icon + category + status */}
      <View style={styles.topRow}>
        <View style={styles.categoryInfo}>
          <Text style={styles.icon}>{categoryConfig.icon}</Text>
          <Text style={styles.categoryName}>{category}</Text>
        </View>
        <Text
          style={[styles.status, { color: getProgressColor() }]}
        >
          {getStatusText()}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${barWidth}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>

      {/* Bottom row: spent / limit + remaining */}
      <View style={styles.bottomRow}>
        <Text style={styles.spentText}>
          {formatCurrency(spent)}
          <Text style={styles.limitText}> / {formatCurrency(monthlyLimit)}</Text>
        </Text>
        <Text
          style={[
            styles.remainingText,
            { color: remaining >= 0 ? COLORS.success : COLORS.danger },
          ]}
        >
          {remaining >= 0
            ? `${formatCurrency(remaining)} left`
            : `${formatCurrency(Math.abs(remaining))} over`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spentText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  limitText: {
    fontWeight: "400",
    color: COLORS.textSecondary,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: "600",
  },
});