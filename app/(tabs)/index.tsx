import { useState, useCallback, useMemo } from "react";
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
import {
  getRecentTransactions,
  getMonthlyTotal,
  deleteTransaction,
} from "../../src/lib/transactions";
import {
  getCurrentMonth,
  formatMonth,
  formatCurrency,
  formatDateGroup,
} from "../../src/utils/date";
import TransactionCard from "../../src/components/TransactionCard";
import SearchBar from "../../src/components/SearchBar";
import CategoryFilter from "../../src/components/CategoryFilter";
import { Transaction } from "../../src/types";
import { COLORS } from "../../src/constants/colors";

// ============================================
// HOME SCREEN - WITH SEARCH & FILTER
// ============================================
// Now includes:
//   - Search bar (filters by description, merchant, category)
//   - Category filter chips (horizontal scroll)
//   - Both filters work together (AND logic)
//
// useMemo: Filters are computed from the full transaction
// list without refetching from the database. This is the
// right pattern — fetch once, filter client-side.
// Only refetch when data actually changes (add/edit/delete).

export default function HomeScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentMonth = getCurrentMonth();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Filter transactions based on search query AND category
  // useMemo ensures this only recalculates when dependencies change,
  // not on every render. Without useMemo, typing each character
  // would re-filter the entire list AND re-render everything.
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Category filter
    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Search filter — checks description, merchant, and category
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.merchant.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [transactions, searchQuery, selectedCategory]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  // Count for showing filter results
  const isFiltering = searchQuery.trim().length > 0 || selectedCategory !== null;

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

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Category Filter */}
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Filter result count */}
      {isFiltering && (
        <Text style={styles.filterCount}>
          {filteredTransactions.length}{" "}
          {filteredTransactions.length === 1 ? "result" : "results"} found
        </Text>
      )}

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to add your first expense
          </Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search or category
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const showDateHeader =
              index === 0 ||
              filteredTransactions[index - 1].date !== item.date;

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
  filterCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 20,
    marginBottom: 8,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
    marginTop: -2,
  },
});