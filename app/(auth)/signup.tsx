import { View, Text, StyleSheet } from "react-native";

// Placeholder signup screen.
// Will include: name, email, password fields,
// Google OAuth option, and Supabase auth integration.

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>Signup screen coming soon</Text>
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