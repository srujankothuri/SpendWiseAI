import { Stack } from "expo-router";

// Layout for authentication screens (login, signup).
// This wraps only the auth-related screens.
// Stack navigator here means login → signup has a
// natural "back" button transition.

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#eaeaea",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
    </Stack>
  );
}