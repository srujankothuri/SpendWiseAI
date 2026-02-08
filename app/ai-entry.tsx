import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { addTransaction } from "../src/lib/transactions";
import { parseNaturalLanguageExpense } from "../src/lib/gemini";
import { getBudgetProgress } from "../src/lib/budgets";
import { getCurrentMonth, formatCurrency } from "../src/utils/date";
import { DEFAULT_CATEGORIES } from "../src/constants/categories";
import { COLORS } from "../src/constants/colors";

export default function AIEntryScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable parsed fields
  const [showResult, setShowResult] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleParse = async () => {
    if (!input.trim()) {
      Alert.alert("Error", "Type something to parse");
      return;
    }

    setParsing(true);
    setShowResult(false);

    try {
      const result = await parseNaturalLanguageExpense(input.trim());
      // Pre-fill editable fields with parsed values
      setAmount(result.amount ? String(result.amount) : "");
      setDescription(result.description || input);
      setMerchant(result.merchant || "");
      setCategory(result.category || "Other");
      setDate(result.date || new Date().toISOString().split("T")[0]);
      setShowResult(true);
    } catch (error: any) {
      Alert.alert(
        "AI Unavailable",
        error.message || "Failed to parse. Please wait a moment and try again."
      );
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await addTransaction({
        user_id: user.id,
        amount: Number(amount),
        description: description || input,
        category,
        merchant,
        date: date || new Date().toISOString().split("T")[0],
      });

      // Check budget
      const budgetProgress = await getBudgetProgress(
        user.id,
        getCurrentMonth()
      );
      const affected = budgetProgress.find(
        (bp: any) => bp.category === category
      );

      if (affected && affected.percentage >= 100) {
        Alert.alert(
          "⚠️ Budget Exceeded!",
          `You've gone over your ${category} budget!`,
          [{ text: "Got it" }]
        );
      } else if (affected && affected.percentage >= 80) {
        Alert.alert(
          "⚡ Budget Warning",
          `You've used ${affected.percentage}% of your ${category} budget.`,
          [{ text: "OK" }]
        );
      }

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const examples = [
    "spent 15 dollars at chipotle yesterday",
    "uber ride home $23.50",
    "netflix monthly subscription",
    "groceries at trader joes $67",
    "paid rent $1200 on the 1st",
  ];

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
          <Text style={styles.headerTitle}>AI Entry ✨</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            Describe your expense naturally
          </Text>
          <Text style={styles.instructionText}>
            Just type like you're texting a friend. AI will figure out the
            amount, category, and date.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder='e.g. "spent 15 bucks at chipotle yesterday"'
            placeholderTextColor={COLORS.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            autoFocus
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleParse}
          />
          <TouchableOpacity
            style={[styles.parseButton, parsing && { opacity: 0.5 }]}
            onPress={handleParse}
            disabled={parsing || !input.trim()}
          >
            {parsing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.parseButtonText}>Parse ✨</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Example prompts */}
        {!showResult && !parsing && (
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>Try these:</Text>
            {examples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => setInput(example)}
              >
                <Text style={styles.exampleText}>"{example}"</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Parsing indicator */}
        {parsing && (
          <View style={styles.parsingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.parsingText}>
              AI is analyzing your expense...
            </Text>
          </View>
        )}

        {/* Editable parsed result */}
        {showResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              Here's what I found — edit if needed:
            </Text>

            {/* Amount */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.fieldInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Merchant */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Merchant</Text>
              <TextInput
                style={styles.fieldInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Store name (optional)"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Text style={styles.categoryButtonText}>
                  {DEFAULT_CATEGORIES.find((c) => c.name === category)?.icon}{" "}
                  {category}
                </Text>
                <Text style={styles.chevron}>
                  {showCategories ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {showCategories && (
                <View style={styles.categoryGrid}>
                  {DEFAULT_CATEGORIES.map((cat) => (
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

            {/* Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {date || "Select date"}
                </Text>
                <Text style={styles.chevronDate}>📅</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date + "T00:00:00") : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") {
                      setShowDatePicker(false);
                    }
                    if (selectedDate) {
                      const formatted = selectedDate.toISOString().split("T")[0];
                      setDate(formatted);
                    }
                  }}
                  themeVariant="dark"
                />
              )}

              {/* Quick date buttons */}
              {!showDatePicker && (
                <View style={styles.dateShortcuts}>
                  <TouchableOpacity
                    style={styles.dateChip}
                    onPress={() =>
                      setDate(new Date().toISOString().split("T")[0])
                    }
                  >
                    <Text style={styles.dateChipText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateChip}
                    onPress={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setDate(y.toISOString().split("T")[0]);
                    }}
                  >
                    <Text style={styles.dateChipText}>Yesterday</Text>
                  </TouchableOpacity>
                  {Platform.OS === "ios" && showDatePicker && (
                    <TouchableOpacity
                      style={styles.dateChip}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.dateChipText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setShowResult(false);
                  setInput("");
                }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving || !amount}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving..." : "Save Expense"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingBottom: 16,
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
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  parseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  parseButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  examplesSection: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  exampleChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  parsingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  parsingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingLeft: 12,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  categoryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 15,
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
    marginTop: 10,
  },
  categoryChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  dateShortcuts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  chevronDate: {
    fontSize: 16,
  },
  dateChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dateChipText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  retryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  retryText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});