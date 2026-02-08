import { View, Text, StyleSheet } from "react-native";

// Placeholder login screen.
// We'll build the full UI with email/password inputs,
// Google OAuth button, and Supabase auth integration later.

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Login screen coming soon</Text>
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