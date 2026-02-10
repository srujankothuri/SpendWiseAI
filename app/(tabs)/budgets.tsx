import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { getBudgetProgress, deleteBudget } from "../../src/lib/budgets";
import { getTransactionsByMonth } from "../../src/lib/transactions";
import {
  getCurrentMonth,
  formatMonth,
  formatCurrency,
  getPreviousMonth,
} from "../../src/utils/date";
import {
  detectRecurringExpenses,
  predictMonthlySpending,
} from "../../src/utils/analytics";
import BudgetProgressCard from "../../src/components/BudgetProgressCard";
import { DEFAULT_CATEGORIES } from "../../src/constants/categories";
import { COLORS } from "../../src/constants/colors";

// ============================================
// BUDGETS SCREEN
// ============================================
// Three sections:
//   1. Budget progress cards (set limits, track spending)
//   2. Spending prediction (pace-based forecast)
//   3. Detected recurring expenses
//
// All three features work WITHOUT any AI API calls.
// These are the "smart offline features" from the build plan.

export default function BudgetsScreen() {
  const router = useRouter();
  const [budgetProgress, setBudgetProgress] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonth = getCurrentMonth();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const prevMonth = getPreviousMonth(currentMonth);
      const twoMonthsAgo = getPreviousMonth(prevMonth);

      const [progress, transactions, lastMonthTxns, twoMonthsAgoTxns] = await Promise.all([
        getBudgetProgress(user.id, currentMonth),
        getTransactionsByMonth(user.id, currentMonth),
        getTransactionsByMonth(user.id, prevMonth),
        getTransactionsByMonth(user.id, twoMonthsAgo),
      ]);

      const lastMonthTotal = lastMonthTxns.reduce((s, t) => s + Number(t.amount), 0);
      const twoMonthsAgoTotal = twoMonthsAgoTxns.reduce((s, t) => s + Number(t.amount), 0);

      setBudgetProgress(progress);
      setPrediction(predictMonthlySpending(transactions, currentMonth, lastMonthTotal, twoMonthsAgoTotal));
      setRecurringExpenses(detectRecurringExpenses(transactions));
    } catch (error) {
      console.error("Error fetching budget data:", error);
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

  const handleDeleteBudget = (id: string, category: string) => {
    Alert.alert(
      "Delete Budget",
      `Remove the ${category} budget?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget(id);
              fetchData();
            } catch (error) {
              console.error("Error deleting budget:", error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* ===== SECTION 1: SPENDING PREDICTION ===== */}
      {prediction && prediction.currentTotal > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Forecast</Text>
          <View style={styles.predictionCard}>
            <Text style={styles.predictionLabel}>
              At your current pace, you'll spend
            </Text>
            <Text style={styles.predictionAmount}>
              {formatCurrency(prediction.predictedTotal)}
            </Text>
            <Text style={styles.predictionLabel}>
              this month
            </Text>
            <View style={styles.predictionStats}>
              <View style={styles.predictionStat}>
                <Text style={styles.statValue}>
                  {formatCurrency(prediction.dailyAverage)}
                </Text>
                <Text style={styles.statLabel}>Daily avg</Text>
              </View>
              <View style={styles.predictionDivider} />
              <View style={styles.predictionStat}>
                <Text style={styles.statValue}>
                  {formatCurrency(prediction.oneTimeTotal)}
                </Text>
                <Text style={styles.statLabel}>Fixed costs</Text>
              </View>
              <View style={styles.predictionDivider} />
              <View style={styles.predictionStat}>
                <Text style={styles.statValue}>
                  {prediction.daysRemaining}
                </Text>
                <Text style={styles.statLabel}>Days left</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ===== SECTION 2: BUDGET PROGRESS ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Budgets — {formatMonth(currentMonth)}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/set-budget")}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {budgetProgress.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No budgets set</Text>
            <Text style={styles.emptySubtext}>
              Set monthly limits to track spending by category
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/set-budget")}
            >
              <Text style={styles.emptyButtonText}>Set Your First Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgetProgress.map((bp) => (
            <BudgetProgressCard
              key={bp.id}
              category={bp.category}
              monthlyLimit={Number(bp.monthly_limit)}
              spent={bp.spent}
              remaining={bp.remaining}
              percentage={bp.percentage}
              onEdit={() =>
                router.push({
                  pathname: "/set-budget",
                  params: {
                    category: bp.category,
                    amount: String(bp.monthly_limit),
                  },
                })
              }
              onDelete={() => handleDeleteBudget(bp.id, bp.category)}
            />
          ))
        )}
      </View>

      {/* ===== SECTION 3: RECURRING EXPENSES ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recurring Expenses</Text>

        {recurringExpenses.length === 0 ? (
          <View style={styles.emptyStateSmall}>
            <Text style={styles.emptySubtext}>
              Recurring expenses will appear here once patterns are detected
              in your spending history
            </Text>
          </View>
        ) : (
          <>
            {/* Total committed spending */}
            <View style={styles.committedCard}>
              <Text style={styles.committedLabel}>
                Estimated monthly commitments
              </Text>
              <Text style={styles.committedAmount}>
                {formatCurrency(
                  recurringExpenses.reduce(
                    (sum, r) => sum + r.averageAmount,
                    0
                  )
                )}
              </Text>
            </View>

            {recurringExpenses.map((expense, index) => {
              const catConfig = DEFAULT_CATEGORIES.find(
                (c) => c.name === expense.category
              );
              return (
                <View key={index} style={styles.recurringCard}>
                  <View style={styles.recurringLeft}>
                    <Text style={styles.recurringIcon}>
                      {catConfig?.icon || "📦"}
                    </Text>
                    <View>
                      <Text style={styles.recurringMerchant}>
                        {expense.merchant}
                      </Text>
                      <Text style={styles.recurringFrequency}>
                        {expense.frequency} • {expense.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recurringAmount}>
                    {formatCurrency(expense.averageAmount)}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Bottom padding */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Prediction styles
  predictionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  predictionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  predictionAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
    marginVertical: 4,
  },
  predictionStats: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
  },
  predictionStat: {
    alignItems: "center",
    flex: 1,
  },
  predictionDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Empty states
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyStateSmall: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },

  // Committed spending
  committedCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  committedLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  committedAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.warning,
    marginTop: 4,
  },

  // Recurring expense cards
  recurringCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  recurringLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recurringIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  recurringMerchant: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  recurringFrequency: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  recurringAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
});