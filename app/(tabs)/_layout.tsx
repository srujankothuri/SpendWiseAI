import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

// ============================================
// TAB LAYOUT WITH BRANDED HEADER
// ============================================
// Custom header shows "SpendWiseAI" on every tab screen.
// The headerTitle function lets us render custom JSX
// instead of plain text — so we can style the "AI"
// part differently for branding.

function AppHeader() {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>
        SpendWise<Text style={styles.headerHighlight}>AI</Text>
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1a1a2e",
          shadowColor: "#0f3460",
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: "#eaeaea",
        headerTitle: () => <AppHeader />,
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
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>💰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#eaeaea",
  },
  headerHighlight: {
    color: "#e94560",
    fontWeight: "bold",
  },
});