import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { supabase } from "../../src/lib/supabase";
import {
  getTransactionsByMonth,
  getSpendingByCategory,
  getMonthlyTotal,
} from "../../src/lib/transactions";
import {
  getCurrentMonth,
  getPreviousMonth,
  getNextMonth,
  formatMonth,
  formatCurrency,
} from "../../src/utils/date";
import { predictCategorySpending } from "../../src/utils/analytics";
import { generateMonthlyInsights, SpendingInsight } from "../../src/lib/gemini";
import { DEFAULT_CATEGORIES } from "../../src/constants/categories";
import { COLORS } from "../../src/constants/colors";

// ============================================
// ANALYTICS SCREEN
// ============================================
// Data visualization dashboard with three charts:
//
// 1. PIE CHART — spending breakdown by category
//    Shows what % of your money goes where.
//    Most useful chart for expense tracking.
//
// 2. BAR CHART — daily spending for the month
//    Shows which days you spent the most.
//    Helps identify spending spikes.
//
// 3. LINE CHART — month-over-month comparison
//    Compares current month vs last month spending.
//    Shows if spending is trending up or down.
//
// Also includes a per-category prediction section
// showing projected month-end spending per category.

const screenWidth = Dimensions.get("window").width;

// Chart.js configuration — controls how all charts look
const chartConfig = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  decimalPlaces: 0,
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: COLORS.surfaceLight,
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 11,
  },
};

export default function AnalyticsScreen() {
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  const [dailySpending, setDailySpending] = useState<any[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [categoryPredictions, setCategoryPredictions] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<number[]>([]);
  const [trendLabels, setTrendLabels] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<SpendingInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const prevMonth = getPreviousMonth(selectedMonth);

      // Fetch everything in parallel
      const [catSpending, transactions, curTotal, prevTotal, prevTransactions] =
        await Promise.all([
          getSpendingByCategory(user.id, selectedMonth),
          getTransactionsByMonth(user.id, selectedMonth),
          getMonthlyTotal(user.id, selectedMonth),
          getMonthlyTotal(user.id, prevMonth),
          getTransactionsByMonth(user.id, prevMonth),
        ]);

      setCategorySpending(catSpending);
      setCurrentMonthTotal(curTotal);
      setLastMonthTotal(prevTotal);

      // Category predictions
      setCategoryPredictions(
        predictCategorySpending(transactions, selectedMonth)
      );

      // Daily spending aggregation for bar chart
      // Groups transactions by day and sums amounts
      const dailyMap: Record<string, number> = {};
      transactions.forEach((t) => {
        const day = t.date.split("-")[2];
        dailyMap[day] = (dailyMap[day] || 0) + Number(t.amount);
      });

      // Convert to sorted array
      const dailyArr = Object.entries(dailyMap)
        .map(([day, amount]) => ({ day, amount }))
        .sort((a, b) => Number(a.day) - Number(b.day));
      setDailySpending(dailyArr);

      // Monthly trend — last 6 months
      const months: string[] = [];
      const totals: number[] = [];
      let trendMonth = selectedMonth;
      for (let i = 0; i < 6; i++) {
        months.unshift(trendMonth);
        const total = await getMonthlyTotal(user.id, trendMonth);
        totals.unshift(total);
        trendMonth = getPreviousMonth(trendMonth);
      }
      setMonthlyTrend(totals);

      // Build line chart labels from months
      setTrendLabels(
        months.map((m) => formatMonth(m).split(" ")[0].slice(0, 3))
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedMonth])
  );

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const transactions = await getTransactionsByMonth(user.id, selectedMonth);
      const prevMonth = getPreviousMonth(selectedMonth);
      const prevTotal = await getMonthlyTotal(user.id, prevMonth);

      const transactionData = transactions.map((t) => ({
        description: t.description,
        amount: Number(t.amount),
        category: t.category,
        date: t.date,
      }));

      const insights = await generateMonthlyInsights(
        transactionData,
        currentMonthTotal,
        prevTotal
      );
      setAiInsights(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      Alert.alert("Error", "Failed to generate AI insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  // Navigate between months
  const goToPrevMonth = () => {
    setAiInsights(null);
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };
  const goToNextMonth = () => {
    const next = getNextMonth(selectedMonth);
    if (next <= getCurrentMonth()) {
      setAiInsights(null);
      setSelectedMonth(next);
    }
  };

  // Prepare pie chart data
  // react-native-chart-kit expects a specific format:
  // [{ name, amount, color, legendFontColor, legendFontSize }]
  const pieData = categorySpending.slice(0, 6).map((cs, index) => {
    const catConfig = DEFAULT_CATEGORIES.find((c) => c.name === cs.category);
    return {
      name: cs.category,
      amount: cs.amount,
      color: catConfig?.color || COLORS.chart[index % COLORS.chart.length],
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 11,
    };
  });

  // Month-over-month change
  const monthChange =
    lastMonthTotal > 0
      ? Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

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
      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Text style={styles.navArrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonth(selectedMonth)}</Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          disabled={selectedMonth === getCurrentMonth()}
        >
          <Text
            style={[
              styles.navArrow,
              selectedMonth === getCurrentMonth() && { opacity: 0.3 },
            ]}
          >
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(currentMonthTotal)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>vs Last Month</Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  monthChange > 0
                    ? COLORS.danger
                    : monthChange < 0
                    ? COLORS.success
                    : COLORS.textPrimary,
              },
            ]}
          >
            {monthChange > 0 ? "+" : ""}
            {monthChange}%
          </Text>
        </View>
      </View>

      {/* No data state */}
      {categorySpending.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySubtext}>
            Add some expenses to see your analytics
          </Text>
        </View>
      ) : (
        <>
          {/* ===== PIE CHART ===== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={pieData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute={false}
              />
            </View>
          </View>

          {/* Category breakdown list */}
          <View style={styles.section}>
            {categorySpending.map((cs, index) => {
              const catConfig = DEFAULT_CATEGORIES.find(
                (c) => c.name === cs.category
              );
              return (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: catConfig?.color || COLORS.textSecondary },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {catConfig?.icon} {cs.category}
                    </Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cs.amount)}
                    </Text>
                    <Text style={styles.categoryPercent}>{cs.percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ===== BAR CHART ===== */}
          {dailySpending.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Spending</Text>
              <View style={styles.chartCard}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                >
                  <BarChart
                    data={{
                      labels: dailySpending.map((d) => d.day),
                      datasets: [
                        {
                          data: dailySpending.map((d) => d.amount),
                        },
                      ],
                    }}
                    width={Math.max(screenWidth - 64, dailySpending.length * 50)}
                    height={200}
                    chartConfig={{
                      ...chartConfig,
                      barPercentage: 0.6,
                    }}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    fromZero
                    showValuesOnTopOfBars
                    style={styles.chart}
                  />
                </ScrollView>
              </View>
            </View>
          )}

          {/* ===== LINE CHART ===== */}
          {monthlyTrend.some((v) => v > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Trend</Text>
              <View style={styles.chartCard}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                >
                  <LineChart
                    data={{
                      labels: trendLabels,
                      datasets: [
                        {
                          data: monthlyTrend.map((v) => v || 0),
                          strokeWidth: 3,
                        },
                      ],
                    }}
                    width={Math.max(screenWidth - 64, trendLabels.length * 60)}
                    height={200}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
                    }}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    fromZero
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              </View>
            </View>
          )}

          {/* ===== CATEGORY PREDICTIONS ===== */}
          {categoryPredictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projected Spending</Text>
              <Text style={styles.sectionSubtitle}>
                At your current pace this month
              </Text>
              {categoryPredictions.map((cp, index) => {
                const catConfig = DEFAULT_CATEGORIES.find(
                  (c) => c.name === cp.category
                );
                return (
                  <View key={index} style={styles.predictionRow}>
                    <Text style={styles.predictionCategory}>
                      {catConfig?.icon} {cp.category}
                    </Text>
                    <View style={styles.predictionAmounts}>
                      <Text style={styles.predictionCurrent}>
                        {formatCurrency(cp.current)}
                      </Text>
                      <Text style={styles.predictionArrow}> → </Text>
                      <Text style={styles.predictionProjected}>
                        {formatCurrency(cp.predicted)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          {/* ===== AI INSIGHTS ===== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Insights ✨</Text>

            {!aiInsights && !loadingInsights && (
              <TouchableOpacity
                style={styles.insightButton}
                onPress={fetchAIInsights}
              >
                <Text style={styles.insightButtonIcon}>🤖</Text>
                <View>
                  <Text style={styles.insightButtonTitle}>
                    Generate AI Insights
                  </Text>
                  <Text style={styles.insightButtonSubtext}>
                    Get personalized spending analysis and tips
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {loadingInsights && (
              <View style={styles.insightLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.insightLoadingText}>
                  AI is analyzing your spending...
                </Text>
              </View>
            )}

            {aiInsights && (
              <View style={styles.insightCard}>
                {/* Summary */}
                <Text style={styles.insightSummary}>
                  {aiInsights.summary}
                </Text>

                {/* Highlights */}
                {aiInsights.highlights.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>
                      ✅ Highlights
                    </Text>
                    {aiInsights.highlights.map((h, i) => (
                      <Text key={i} style={styles.insightItem}>
                        {h}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Warnings */}
                {aiInsights.warnings.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>
                      ⚠️ Watch Out
                    </Text>
                    {aiInsights.warnings.map((w, i) => (
                      <Text key={i} style={styles.insightItem}>
                        {w}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Tips */}
                {aiInsights.tips.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>
                      💡 Saving Tips
                    </Text>
                    {aiInsights.tips.map((t, i) => (
                      <Text key={i} style={styles.insightItem}>
                        {t}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Regenerate */}
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={() => {
                    setAiInsights(null);
                    fetchAIInsights();
                  }}
                >
                  <Text style={styles.regenerateText}>
                    🔄 Regenerate Insights
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}

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

  // Month navigation
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navArrow: {
    fontSize: 18,
    color: COLORS.primary,
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  // Summary cards
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },

  // Chart card
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  chart: {
    borderRadius: 12,
  },

  // Category breakdown
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  categoryPercent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 36,
    textAlign: "right",
  },

  // Predictions
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  predictionCategory: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  predictionAmounts: {
    flexDirection: "row",
    alignItems: "center",
  },
  predictionCurrent: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  predictionArrow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  predictionProjected: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    padding: 40,
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

  // AI Insights
  insightButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  insightButtonIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  insightButtonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  insightButtonSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  insightLoading: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  insightLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  insightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  insightSummary: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  insightSection: {
    marginBottom: 16,
  },
  insightSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  insightItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
  },
  regenerateButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  regenerateText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});