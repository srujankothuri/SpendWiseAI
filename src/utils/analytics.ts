import { Transaction } from "../types";

// ============================================
// RECURRING EXPENSE DETECTION
// ============================================
// Algorithm to find recurring expenses in transaction history.
//
// How it works:
// 1. Group transactions by merchant (or description if no merchant)
// 2. For each group, check if amounts are similar (within 10%)
// 3. Check if dates follow a regular pattern (weekly, biweekly, monthly)
// 4. If both conditions met → flagged as recurring
//
// This is the kind of algorithm interviewers love asking about.
// It shows pattern recognition, grouping logic, and tolerance
// handling (fuzzy amount matching).

interface RecurringExpense {
  merchant: string;
  category: string;
  averageAmount: number;
  frequency: string; // "weekly", "biweekly", "monthly"
  count: number; // how many times it appeared
  lastDate: string;
}

export function detectRecurringExpenses(
  transactions: Transaction[]
): RecurringExpense[] {
  // Group by merchant or description
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((t) => {
    // Use merchant if available, otherwise use description
    const key = (t.merchant || t.description).toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const recurring: RecurringExpense[] = [];

  for (const [key, txns] of Object.entries(groups)) {
    // Need at least 2 occurrences to detect a pattern
    if (txns.length < 2) continue;

    // Check if amounts are similar (within 10% tolerance)
    // This handles cases like subscriptions that change slightly
    // e.g. Netflix $15.99 one month, $16.49 after a price increase
    const amounts = txns.map((t) => Number(t.amount));
    const avgAmount =
      amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const allSimilar = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
    );

    if (!allSimilar) continue;

    // Check date intervals
    const dates = txns
      .map((t) => new Date(t.date + "T00:00:00").getTime())
      .sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    // Calculate average interval
    const avgInterval =
      intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

    // Determine frequency based on average interval
    let frequency = "";
    if (avgInterval >= 5 && avgInterval <= 10) {
      frequency = "weekly";
    } else if (avgInterval >= 12 && avgInterval <= 18) {
      frequency = "biweekly";
    } else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
    }

    // If we detected a valid frequency, it's recurring
    if (frequency) {
      // Get the display name — capitalize the key
      const displayName =
        txns[0].merchant ||
        key.charAt(0).toUpperCase() + key.slice(1);

      recurring.push({
        merchant: displayName,
        category: txns[0].category,
        averageAmount: Math.round(avgAmount * 100) / 100,
        frequency,
        count: txns.length,
        lastDate: txns.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0].date,
      });
    }
  }

  // Sort by amount (highest first)
  return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
}

// ============================================
// SPENDING PREDICTION
// ============================================
// Predicts month-end spending based on current pace.
//
// Uses a simple but effective approach:
//   daily_average = total_spent_so_far / days_elapsed
//   predicted_total = daily_average * total_days_in_month
//
// Also calculates comparison with last month.
// This is a "simple moving average" approach —
// basic but practical and easy to explain in interviews.

interface SpendingPrediction {
  currentTotal: number;
  dailyAverage: number;
  predictedTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
}

export function predictMonthlySpending(
  transactions: Transaction[],
  month: string
): SpendingPrediction {
  const [year, mon] = month.split("-").map(Number);
  const totalDays = new Date(year, mon, 0).getDate();

  // How many days have passed in this month
  const today = new Date();
  let daysElapsed: number;

  // Check if we're looking at the current month
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  if (month === currentMonth) {
    daysElapsed = today.getDate();
  } else {
    // Past month — all days elapsed
    daysElapsed = totalDays;
  }

  // Calculate total spending
  const currentTotal = transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // Daily average and prediction
  const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0;
  const predictedTotal = dailyAverage * totalDays;
  const daysRemaining = totalDays - daysElapsed;

  return {
    currentTotal: Math.round(currentTotal * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    predictedTotal: Math.round(predictedTotal * 100) / 100,
    daysElapsed,
    daysRemaining,
    totalDays,
  };
}

// Per-category spending prediction
// Shows "At this pace, you'll spend $X on Food this month"
export function predictCategorySpending(
  transactions: Transaction[],
  month: string
): { category: string; predicted: number; current: number }[] {
  const [year, mon] = month.split("-").map(Number);
  const totalDays = new Date(year, mon, 0).getDate();

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  const daysElapsed =
    month === currentMonth ? today.getDate() : totalDays;

  // Group by category
  const categorySpending: Record<string, number> = {};
  transactions.forEach((t) => {
    categorySpending[t.category] =
      (categorySpending[t.category] || 0) + Number(t.amount);
  });

  return Object.entries(categorySpending)
    .map(([category, current]) => ({
      category,
      current: Math.round(current * 100) / 100,
      predicted:
        daysElapsed > 0
          ? Math.round(((current / daysElapsed) * totalDays) * 100) / 100
          : 0,
    }))
    .sort((a, b) => b.predicted - a.predicted);
}