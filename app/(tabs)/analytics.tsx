import { View, Text, StyleSheet } from "react-native";

// Analytics screen - data visualization dashboard.
// Will contain:
//   - Pie chart (spending by category)
//   - Bar chart (daily/weekly spending)
//   - Line chart (month-over-month trends)
//   - AI-generated monthly insights

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Charts and insights coming soon</Text>
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