import { Tabs } from "expo-router";
import { Text } from "react-native";

// This creates the bottom tab bar you see in most apps.
// Each Tab.Screen maps to a file in this (tabs) folder.
// The tab bar stays visible on all these screens.
//
// We're using emoji icons for now — we'll replace them
// with proper icons (lucide or expo vector icons) later.

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#eaeaea",
        tabBarStyle: {
          backgroundColor: "#16213e",
          borderTopColor: "#0f3460",
        },
        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: "#a0a0a0",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}