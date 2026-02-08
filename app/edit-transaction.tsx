import { useState, useRef } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { updateTransaction, deleteTransaction } from "../src/lib/transactions";
import { getToday } from "../src/utils/date";
import { DEFAULT_CATEGORIES } from "../src/constants/categories";
import { COLORS } from "../src/constants/colors";

// ============================================
// EDIT TRANSACTION SCREEN
// ============================================
// Opens when user taps a transaction card.
// Pre-fills all fields with existing data.
// User can edit any field and save, or delete.
//
// useLocalSearchParams: Reads data passed through
// the URL when navigating here. Expo Router passes
// params as URL query strings under the hood.

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    amount: string;
    description: string;
    category: string;
    merchant: string;
    date: string;
  }>();

  const [amount, setAmount] = useState(params.amount || "");
  const [description, setDescription] = useState(params.description || "");
  const [category, setCategory] = useState(params.category || "Other");
  const [merchant, setMerchant] = useState(params.merchant || "");
  const [date, setDate] = useState(params.date || getToday());
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const descriptionRef = useRef<TextInput>(null);
  const merchantRef = useRef<TextInput>(null);

  const handleSave = async () => {
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
      await updateTransaction(params.id, {
        amount: Number(amount),
        description: description.trim(),
        category,
        merchant: merchant.trim(),
        date,
      });

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(params.id);
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete");
            }
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Edit Expense</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
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

        {/* Description */}
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
        </View>

        {/* Category Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
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

        {/* Merchant */}
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

        {/* Date */}
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

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Transaction</Text>
        </TouchableOpacity>
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
  deleteButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
  },
  deleteText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "600",
  },
});