import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Transaction } from "../types";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import { COLORS } from "../constants/colors";
import { formatCurrency } from "../utils/date";

// ============================================
// TRANSACTION CARD COMPONENT
// ============================================
// Displays a single transaction in the list.
// Shows: category icon, description, merchant,
// amount, and category name.
//
// Long press triggers delete confirmation.
// Tap could open edit (we'll add that later).
//
// This is a "presentational" component — it receives
// data via props and doesn't fetch anything itself.
// This pattern makes components reusable and testable.

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export default function TransactionCard({
  transaction,
  onDelete,
  onEdit,
}: TransactionCardProps) {
  // Find the category config for icon and color
  const categoryConfig = DEFAULT_CATEGORIES.find(
    (c) => c.name === transaction.category
  ) || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]; // fallback to "Other"

  const handleLongPress = () => {
    Alert.alert(
      "Delete Transaction",
      `Delete "${transaction.description}" for ${formatCurrency(transaction.amount)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(transaction.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={handleLongPress}
      onPress={() => onEdit?.(transaction)}
      activeOpacity={0.7}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryConfig.color + "20" },
          // "20" adds 12% opacity to the hex color — creates
          // a subtle tinted background for the icon
        ]}
      >
        <Text style={styles.icon}>{categoryConfig.icon}</Text>
      </View>

      {/* Description & Category */}
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.categoryText}>
          {transaction.merchant
            ? `${transaction.merchant} • ${transaction.category}`
            : transaction.category}
        </Text>
      </View>

      {/* Amount */}
      <Text style={styles.amount}>
        -{formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.danger,
  },
});