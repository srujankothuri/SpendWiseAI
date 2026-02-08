import { View, Text, StyleSheet } from "react-native";

// Budgets screen - manage monthly budgets per category.
// Will contain:
//   - List of budget categories with progress bars
//   - Set/edit monthly limits
//   - Alerts when approaching or exceeding budget
//   - Recurring expenses section

export default function BudgetsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budgets</Text>
      <Text style={styles.subtitle}>Budget management coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e94560",
  },
  subtitle: {
    fontSize: 14,
    color: "#eaeaea",
    marginTop: 8,
  },
});