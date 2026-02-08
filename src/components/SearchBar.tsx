import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

// ============================================
// SEARCH BAR COMPONENT
// ============================================
// Reusable search input with a clear button.
// Used on the home screen to filter transactions
// by description, merchant, or category name.
//
// This is a "controlled" component — the parent
// owns the state (searchQuery) and passes it down.
// The component just renders UI and calls back
// when the user types or clears.

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search transactions...",
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Text style={styles.clearButton}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: 4,
  },
});