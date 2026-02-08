import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { setBudget } from "../src/lib/budgets";
import { getCurrentMonth, formatMonth } from "../src/utils/date";
import { DEFAULT_CATEGORIES } from "../src/constants/categories";
import { COLORS } from "../src/constants/colors";

// ============================================
// SET BUDGET SCREEN
// ============================================
// Modal for creating or editing a monthly budget
// for a specific category. If params include an
// existing amount, it's an edit. Otherwise it's new.
//
// The user picks a category and enters a monthly
// spending limit. The budget applies to the current month.

export default function SetBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    amount?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState(
    params.category || ""
  );
  const [amount, setAmount] = useState(params.amount || "");
  const [loading, setLoading] = useState(false);

  const currentMonth = getCurrentMonth();
  const isEditing = !!params.category;

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await setBudget({
        user_id: user.id,
        category: selectedCategory,
        monthly_limit: Number(amount),
        month: currentMonth,
      });

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  // Quick amount buttons — common budget amounts
  const quickAmounts = [50, 100, 200, 300, 500];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Budget" : "Set Budget"}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month indicator */}
        <Text style={styles.monthLabel}>{formatMonth(currentMonth)}</Text>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>
        <Text style={styles.amountLabel}>Monthly spending limit</Text>

        {/* Quick amount buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((qa) => (
            <TouchableOpacity
              key={qa}
              style={[
                styles.quickChip,
                amount === String(qa) && styles.quickChipActive,
              ]}
              onPress={() => setAmount(String(qa))}
            >
              <Text
                style={[
                  styles.quickChipText,
                  amount === String(qa) && styles.quickChipTextActive,
                ]}
              >
                ${qa}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
          {isEditing ? (
            // If editing, show the category as fixed (can't change)
            <View style={styles.fixedCategory}>
              <Text style={styles.fixedCategoryText}>
                {DEFAULT_CATEGORIES.find((c) => c.name === selectedCategory)?.icon}{" "}
                {selectedCategory}
              </Text>
            </View>
          ) : (
            // If new, show selectable grid
            <View style={styles.categoryGrid}>
              {DEFAULT_CATEGORIES.filter((c) => c.id !== "other").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.name && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={styles.categoryChipText}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  saveText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  monthLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    paddingVertical: 16,
  },
  dollarSign: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    minWidth: 120,
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  quickChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  quickChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  quickChipTextActive: {
    color: "#ffffff",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  fixedCategory: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  fixedCategoryText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
});