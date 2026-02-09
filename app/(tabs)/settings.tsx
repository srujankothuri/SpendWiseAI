import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Share,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import {
  getAllLearnedCategories,
  clearLearnedCategories,
} from "../../src/utils/learnedCategories";
import { getCustomCategories, deleteCustomCategory, clearCustomCategories } from "../../src/utils/customCategories";
import { exportTransactionsToCSV } from "../../src/utils/exportImport";
import { COLORS } from "../../src/constants/colors";

// ============================================
// SETTINGS SCREEN (Enhanced)
// ============================================
// Sections:
//   1. Profile — user info + avatar
//   2. Your Stats — lifetime spending stats
//   3. Smart Features — learned categories info
//   4. Data — export, clear data
//   5. About — version, tech stack
//   6. Logout

export default function SettingsScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [learnedCount, setLearnedCount] = useState(0);
  const [learnedMappings, setLearnedMappings] = useState<Record<string, string>>({});
  const [showLearnedDetails, setShowLearnedDetails] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [memberSince, setMemberSince] = useState("");
  const [topCategory, setTopCategory] = useState("");
  const [customCats, setCustomCats] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email || "");
    setUserName(user.user_metadata?.name || "");

    // Member since
    const created = new Date(user.created_at);
    setMemberSince(
      created.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );

    // Lifetime stats
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", user.id);

    if (transactions) {
      setTotalTransactions(transactions.length);
      const total = transactions.reduce(
        (sum: number, t: { amount: number }) => sum + Number(t.amount),
        0
      );
      setTotalSpent(total);

      // Find top category
      const catCounts: Record<string, number> = {};
      transactions.forEach((t: { category: string; amount: number }) => {
        catCounts[t.category] =
          (catCounts[t.category] || 0) + Number(t.amount);
      });
      const sorted = Object.entries(catCounts).sort(
        (a, b) => b[1] - a[1]
      );
      if (sorted.length > 0) {
        setTopCategory(sorted[0][0]);
      }
    }

    // Learned categories
    const learned = await getAllLearnedCategories();
    setLearnedCount(Object.keys(learned).length);
    setLearnedMappings(learned);

    // Custom categories
    const custom = await getCustomCategories();
    setCustomCats(custom);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (!data || data.length === 0) {
        Alert.alert("No Data", "No transactions to export");
        return;
      }

      await exportTransactionsToCSV(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteCustomCategory = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Remove "${name}"? Existing transactions with this category won't be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCustomCategory(id);
            const custom = await getCustomCategories();
            setCustomCats(custom);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleResetLearned = () => {
    Alert.alert(
      "Reset Learned Categories",
      "This will clear all category corrections the app has learned. Auto-categorization will start fresh.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearLearnedCategories();
            setLearnedCount(0);
            Alert.alert("Done", "Learned categories have been reset");
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete ALL your transactions and budgets. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;

              await supabase
                .from("transactions")
                .delete()
                .eq("user_id", user.id);
              await supabase
                .from("budgets")
                .delete()
                .eq("user_id", user.id);
              await clearLearnedCategories();
              await clearCustomCategories();

              setTotalTransactions(0);
              setTotalSpent(0);
              setTopCategory("");
              setLearnedCount(0);
              setCustomCats([]);

              Alert.alert("Done", "All data has been cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          "Check out SpendWiseAI — an AI-powered expense tracker that learns your spending habits! 💰",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* ===== PROFILE ===== */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName
                ? userName.charAt(0).toUpperCase()
                : userEmail.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {userName ? (
              <Text style={styles.profileName}>{userName}</Text>
            ) : null}
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <Text style={styles.memberSince}>
              Member since {memberSince}
            </Text>
          </View>
        </View>
      </View>

      {/* ===== YOUR STATS ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${totalSpent.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalTransactions > 0
                ? "$" + (totalSpent / totalTransactions).toFixed(0)
                : "$0"}
            </Text>
            <Text style={styles.statLabel}>Avg per Entry</Text>
          </View>
        </View>
        {topCategory ? (
          <View style={styles.topCategoryCard}>
            <Text style={styles.topCategoryLabel}>
              Top spending category
            </Text>
            <Text style={styles.topCategoryValue}>{topCategory}</Text>
          </View>
        ) : null}
      </View>

      {/* ===== SMART FEATURES ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Features</Text>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => setShowLearnedDetails(!showLearnedDetails)}
        >
          <Text style={styles.settingIcon}>🧠</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Learned Categories</Text>
            <Text style={styles.settingDescription}>
              {learnedCount === 0
                ? "No corrections learned yet. When you fix a wrong category, the app remembers it."
                : `${learnedCount} correction${learnedCount > 1 ? "s" : ""} remembered. Tap to view.`}
            </Text>
          </View>
          {learnedCount > 0 && (
            <Text style={styles.chevron}>
              {showLearnedDetails ? "▲" : "▼"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Learned mappings detail view */}
        {showLearnedDetails && learnedCount > 0 && (
          <View style={styles.learnedDetailsCard}>
            {Object.entries(learnedMappings).map(([key, value], index) => (
              <View
                key={index}
                style={[
                  styles.learnedRow,
                  index < Object.keys(learnedMappings).length - 1 && styles.learnedRowBorder,
                ]}
              >
                <Text style={styles.learnedKey} numberOfLines={1}>
                  "{key}"
                </Text>
                <Text style={styles.learnedArrow}>→</Text>
                <Text style={styles.learnedValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {learnedCount > 0 && (
          <TouchableOpacity
            style={styles.textButton}
            onPress={handleResetLearned}
          >
            <Text style={styles.textButtonWarning}>
              Reset Learned Categories
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.settingCard}>
          <Text style={styles.settingIcon}>📊</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Categorization</Text>
            <Text style={styles.settingDescription}>
              3-layer system: Learned corrections → Keyword matching → AI
              fallback
            </Text>
          </View>
        </View>
      </View>

      {/* ===== CUSTOM CATEGORIES ===== */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Custom Categories ({customCats.length})
          </Text>
          <TouchableOpacity
            style={styles.addCatButton}
            onPress={() => router.push("/add-category")}
          >
            <Text style={styles.addCatText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {customCats.length === 0 ? (
          <View style={styles.settingCard}>
            <Text style={styles.settingIcon}>🏷️</Text>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>No custom categories</Text>
              <Text style={styles.settingDescription}>
                Create your own categories for expenses that don't fit
                the defaults
              </Text>
            </View>
          </View>
        ) : (
          customCats.map((cat) => (
            <View key={cat.id} style={styles.customCatCard}>
              <View style={styles.customCatLeft}>
                <Text style={styles.settingIcon}>{cat.icon}</Text>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{cat.name}</Text>
                  <Text style={styles.settingDescription}>
                    {cat.keywords.length > 0
                      ? `Keywords: ${cat.keywords.slice(0, 3).join(", ")}${cat.keywords.length > 3 ? "..." : ""}`
                      : "No keywords set"}
                  </Text>
                </View>
              </View>
              <View style={styles.customCatRight}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: cat.color },
                  ]}
                />
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteCustomCategory(cat.id, cat.name)
                  }
                  style={styles.deleteCatButton}
                >
                  <Text style={styles.deleteCatText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ===== DATA MANAGEMENT ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleExportCSV}
          disabled={exporting}
        >
          <Text style={styles.settingIcon}>📤</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>
              {exporting ? "Exporting..." : "Export to CSV"}
            </Text>
            <Text style={styles.settingDescription}>
              Download all transactions as a CSV file
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => router.push("/import-csv")}
        >
          <Text style={styles.settingIcon}>📥</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Import from CSV</Text>
            <Text style={styles.settingDescription}>
              Upload a CSV file to add transactions in bulk
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleShareApp}
        >
          <Text style={styles.settingIcon}>🔗</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Share SpendWiseAI</Text>
            <Text style={styles.settingDescription}>
              Tell your friends about the app
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleClearAllData}
        >
          <Text style={styles.settingIcon}>🗑️</Text>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: COLORS.danger }]}>
              Clear All Data
            </Text>
            <Text style={styles.settingDescription}>
              Delete all transactions, budgets, and learned data
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ===== ABOUT ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingCard}>
          <Text style={styles.settingIcon}>📱</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>SpendWiseAI</Text>
            <Text style={styles.settingDescription}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingIcon}>⚡</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Tech Stack</Text>
            <Text style={styles.settingDescription}>
              React Native • Expo • TypeScript • Supabase • Gemini AI
            </Text>
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingIcon}>👨‍💻</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Built By</Text>
            <Text style={styles.settingDescription}>
              Venkata Srujan Kothuri
            </Text>
          </View>
        </View>
      </View>

      {/* ===== LOGOUT ===== */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutText}>
          {loggingOut ? "Signing out..." : "Sign Out"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addCatButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCatText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  customCatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    marginBottom: 8,
  },
  customCatLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customCatRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteCatButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.danger + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteCatText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Profile
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  memberSince: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  topCategoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  topCategoryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  topCategoryValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  // Settings cards
  settingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    marginBottom: 8,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },

  // Buttons
  textButton: {
    padding: 12,
    alignItems: "center",
  },
  textButtonWarning: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: "600",
  },
  learnedDetailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  learnedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  learnedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  learnedKey: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  learnedArrow: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  learnedValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "bold",
  },
});