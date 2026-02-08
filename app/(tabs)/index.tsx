import { View, Text, StyleSheet } from "react-native";

// Home screen - the main screen users see after login.
// This will show:
//   - Monthly spending summary at the top
//   - Budget progress bars
//   - Recent transactions list
//   - Floating "+" button to add new expense

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Your transactions will appear here</Text>
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