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
import { useRouter } from "expo-router";
import { addCustomCategory } from "../src/utils/customCategories";
import { COLORS } from "../src/constants/colors";

// ============================================
// ADD CUSTOM CATEGORY SCREEN
// ============================================
// Users can create their own categories with:
//   - Custom name
//   - Emoji icon (pick from a grid)
//   - Color (pick from palette)
//   - Keywords for auto-categorization

const EMOJI_OPTIONS = [
  "🎵", "🎮", "✈️", "🐶", "🎁", "💇", "🏋️", "📸",
  "🎨", "🏖️", "🚀", "💼", "🎓", "🛠️", "🌱", "☕",
  "🍷", "🎪", "💎", "🧹", "👶", "💊", "🚿", "📞",
];

const COLOR_OPTIONS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
  "#3498db", "#9b59b6", "#e91e63", "#00bcd4", "#ff5722",
  "#795548", "#607d8b",
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎵");
  const [color, setColor] = useState("#3498db");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (name.trim().length > 20) {
      Alert.alert("Error", "Category name must be 20 characters or less");
      return;
    }

    setLoading(true);

    try {
      // Split keywords by comma and clean up
      const keywordList = keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      await addCustomCategory({
        name: name.trim(),
        icon,
        color,
        keywords: keywordList,
      });

      Alert.alert("Success", `"${name.trim()}" category created!`);
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create category");
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
          <Text style={styles.headerTitle}>New Category</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={[styles.previewCard, { borderColor: color }]}>
          <Text style={styles.previewIcon}>{icon}</Text>
          <Text style={styles.previewName}>
            {name || "Category Name"}
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pets, Travel, Gifts"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoFocus
          />
        </View>

        {/* Icon Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.grid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiChip,
                  icon === emoji && {
                    backgroundColor: color + "30",
                    borderColor: color,
                  },
                ]}
                onPress={() => setIcon(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.grid}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorChip,
                  { backgroundColor: c },
                  color === c && styles.colorChipSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Keywords Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Auto-categorize Keywords (comma separated)
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="e.g. petco, vet, dog food, cat litter"
            placeholderTextColor={COLORS.textSecondary}
            value={keywords}
            onChangeText={setKeywords}
            multiline
          />
          <Text style={styles.hint}>
            When you type these words in a transaction, this category
            will be auto-selected
          </Text>
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
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  previewName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
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
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorChipSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
});