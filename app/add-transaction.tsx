import { useState, useEffect, useRef } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { addTransaction } from "../src/lib/transactions";
import { getBudgetProgress } from "../src/lib/budgets";
import { categorizeExpense, extractMerchant, smartCategorize } from "../src/utils/categorize";
import { learnCategory } from "../src/utils/learnedCategories";
import { getToday, getCurrentMonth } from "../src/utils/date";
import { DEFAULT_CATEGORIES } from "../src/constants/categories";
import { useCategories } from "../src/hooks/useCategories";
import { COLORS } from "../src/constants/colors";

// ============================================
// ADD TRANSACTION SCREEN
// ============================================
// This is where users add new expenses.
// Key features:
// - Auto-categorization as user types description
// - Category picker with visual icons
// - Date picker (defaults to today)
// - Merchant auto-extraction from description
//
// Registered as a modal in _layout.tsx so it
// slides up from the bottom over the tab screens.

export default function AddTransactionScreen() {
  const router = useRouter();
  const { categories } = useCategories();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [autoCategory, setAutoCategory] = useState("Other"); // what the engine suggested
  const [categorySource, setCategorySource] = useState<"learned" | "keyword" | "default">("default");

  // Refs for jumping between fields on "return" key
  const descriptionRef = useRef<TextInput>(null);
  const merchantRef = useRef<TextInput>(null);

  // Auto-categorize as user types description
  // Uses the 3-layer smart system:
  //   1. Check learned corrections first
  //   2. Keyword matching
  //   3. Default to "Other" (AI in Phase 5)
  useEffect(() => {
    if (description.length > 2) {
      smartCategorize(description).then((result) => {
        if (result.confidence > 0.5) {
          setCategory(result.category);
          setAutoCategory(result.category);
          setCategorySource(result.source);
        }
      });

      const extractedMerchant = extractMerchant(description);
      if (extractedMerchant && !merchant) {
        setMerchant(extractedMerchant);
      }
    }
  }, [description]);

  const handleSave = async () => {
    // Validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Not authenticated");
        return;
      }

      await addTransaction({
        user_id: user.id,
        amount: Number(amount),
        description: description.trim(),
        category,
        merchant: merchant.trim(),
        date,
      });

      // If user changed the category from what was auto-detected,
      // learn from the correction so next time we get it right
      if (category !== autoCategory) {
        await learnCategory(description, merchant, category);
      }

      // Check if this transaction pushed any budget past its limit
      const budgetProgress = await getBudgetProgress(user.id, getCurrentMonth());
      const affectedBudget = budgetProgress.find(
        (bp: any) => bp.category === category
      );

      if (affectedBudget) {
        if (affectedBudget.percentage >= 100) {
          Alert.alert(
            "⚠️ Budget Exceeded!",
            `You've gone over your ${category} budget!\n\nSpent: ${affectedBudget.spent.toFixed(2)} / ${Number(affectedBudget.monthly_limit).toFixed(2)}`,
            [{ text: "Got it" }]
          );
        } else if (affectedBudget.percentage >= 80) {
          Alert.alert(
            "⚡ Budget Warning",
            `You've used ${affectedBudget.percentage}% of your ${category} budget.\n\n${(affectedBudget.remaining).toFixed(2)} remaining this month.`,
            [{ text: "OK" }]
          );
        }
      }

      // Go back to home screen
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input - Large and prominent */}
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
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
          />
        </View>

        {/* Description Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            ref={descriptionRef}
            style={styles.input}
            placeholder="e.g. Coffee at Starbucks"
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            returnKeyType="next"
            onSubmitEditing={() => merchantRef.current?.focus()}
          />
          {description.length > 2 && (
            <Text style={styles.autoDetect}>
              {categorySource === "learned"
                ? `Remembered: ${category} 🧠`
                : `Auto-detected: ${category} ✨`}
            </Text>
          )}
        </View>

        {/* Category Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={styles.categoryButtonText}>
              {categories.find((c) => c.name === category)?.icon || "📦"}{" "}
              {category}
            </Text>
            <Text style={styles.chevron}>
              {showCategories ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.name && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategories(false);
                  }}
                >
                  <Text style={styles.categoryChipText}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Merchant Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Merchant (optional)</Text>
          <TextInput
            ref={merchantRef}
            style={styles.input}
            placeholder="e.g. Starbucks"
            placeholderTextColor={COLORS.textSecondary}
            value={merchant}
            onChangeText={setMerchant}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        {/* Date Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{date}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(date + "T00:00:00")}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(false);
                }
                if (selectedDate) {
                  setDate(selectedDate.toISOString().split("T")[0]);
                }
              }}
              themeVariant="dark"
            />
          )}

          {!showDatePicker && (
            <View style={styles.dateShortcuts}>
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => setDate(getToday())}
              >
                <Text style={styles.dateChipText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday.toISOString().split("T")[0]);
                }}
              >
                <Text style={styles.dateChipText}>Yesterday</Text>
              </TouchableOpacity>
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
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
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  autoDetect: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 6,
    marginLeft: 4,
  },
  categoryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
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
  dateShortcuts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dateIcon: {
    fontSize: 18,
  },
  dateChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dateChipText: {
    color: COLORS.primary,
    fontSize: 13,
  },
});