import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// This is the ROOT layout - it wraps every screen in the app.
// Think of it as the outermost container.
// The Stack navigator gives us screen-to-screen navigation with
// back buttons and slide animations (like how most apps work).

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* 
          headerShown: false hides the default header globally.
          We'll add custom headers per screen later.
          
          Each "screen" here maps to a file/folder in the app/ directory:
          - (auth) group = login/signup screens
          - (tabs) group = main app with bottom tab bar
        */}
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}