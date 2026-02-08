import { View, Text, StyleSheet } from "react-native";

// This is the app's entry point - the first screen users see.
// Later we'll add logic here to check if user is logged in:
//   - If yes → redirect to (tabs) home screen
//   - If no → redirect to (auth) login screen
// For now, it's just a placeholder to confirm routing works.

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SpendWiseAI</Text>
      <Text style={styles.subtitle}>Your AI-Powered Expense Tracker</Text>
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#e94560",
  },
  subtitle: {
    fontSize: 16,
    color: "#eaeaea",
    marginTop: 8,
  },
});