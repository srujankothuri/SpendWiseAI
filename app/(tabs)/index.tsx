import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { getRecentTransactions, getMonthlyTotal, deleteTransaction } from "../../src/lib/transactions";
import { getCurrentMonth, formatMonth, formatCurrency, formatDateGroup } from "../../src/utils/date";
import TransactionCard from "../../src/components/TransactionCard";
import { Transaction } from "../../src/types";
import { COLORS } from "../../src/constants/colors";

// ============================================
// HOME SCREEN
// ============================================
// The main screen users see after logging in.
// Shows:
//   - Monthly spending total at the top
//   - Transaction list grouped by date
//   - Floating "+" button to add new expense
//
// useFocusEffect: Refetches data every time user
// navigates back to this screen (e.g. after adding
// a transaction). Unlike useEffect which only runs
// on mount, this runs on every focus.
//
// FlatList: Efficiently renders large lists by only
// rendering items visible on screen (virtualization).
// Much better than ScrollView for long lists.

export default function HomeScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonth = getCurrentMonth();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [txns, total] = await Promise.all([
        getRecentTransactions(user.id, 50),
        getMonthlyTotal(user.id, currentMonth),
      ]);

      setTransactions(txns);
      setMonthlyTotal(total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      // Remove from local state immediately (optimistic update)
      // This makes the UI feel instant instead of waiting
      // for a refetch from the server
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      // Refetch total
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const total = await getMonthlyTotal(user.id, currentMonth);
        setMonthlyTotal(total);
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Group transactions by date for section-like display
  const groupedDates = [
    ...new Set(transactions.map((t) => t.date)),
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Monthly Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{formatMonth(currentMonth)}</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(monthlyTotal)}
        </Text>
        <Text style={styles.summarySubtext}>Total spent this month</Text>
      </View>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to add your first expense
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            // Show date header when date changes
            const showDateHeader =
              index === 0 || transactions[index - 1].date !== item.date;

            return (
              <View>
                {showDateHeader && (
                  <Text style={styles.dateHeader}>
                    {formatDateGroup(item.date)}
                  </Text>
                )}
                <TransactionCard
                  transaction={item}
                  onDelete={handleDelete}
                  onEdit={(t) =>
                    router.push({
                      pathname: "/edit-transaction",
                      params: {
                        id: t.id,
                        amount: String(t.amount),
                        description: t.description,
                        category: t.category,
                        merchant: t.merchant,
                        date: t.date,
                      },
                    })
                  }
                />
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-transaction")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  summarySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    // Shadow for iOS
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
    marginTop: -2,
  },
});