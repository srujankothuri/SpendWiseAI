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
// SPENDING PREDICTION (Smart Separation)
// ============================================
// Key insight: Not all expenses are equal.
//   - Rent, subscriptions, insurance → one-time monthly (won't repeat)
//   - Coffee, groceries, transport → recurring daily (will continue)
//
// Algorithm:
//   1. Separate transactions into "one-time" and "regular"
//   2. One-time expenses are counted as-is (they already happened)
//   3. Regular expenses are projected forward based on daily average
//   4. prediction = one_time_total + (regular_daily_avg × total_days)
//
// How we detect one-time expenses:
//   - Amount > $75 AND appears only once in the month
//   - OR category is Housing/Subscriptions (these are typically monthly fixed)
//
// Example (Feb 8, 28-day month):
//   Rent $1200 (one-time) + 7 days of regular spending totaling $175
//   Regular daily avg = $175 / 7 = $25/day
//   Prediction = $1200 + ($25 × 28) = $1,900
//   vs old method: ($1375 / 7) × 28 = $5,500 (wildly wrong)
//
// This is a strong interview talking point — shows you understand
// that naive averaging fails with mixed spending patterns.

interface SpendingPrediction {
  currentTotal: number;
  dailyAverage: number;
  predictedTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  oneTimeTotal: number;
  regularTotal: number;
}

const ONE_TIME_CATEGORIES = ["Housing", "Subscriptions"];
const ONE_TIME_THRESHOLD = 75; // amounts above this checked for one-time pattern

export function predictMonthlySpending(
  transactions: Transaction[],
  month: string,
  lastMonthTotal?: number,
  twoMonthsAgoTotal?: number
): SpendingPrediction {
  const [year, mon] = month.split("-").map(Number);
  const totalDays = new Date(year, mon, 0).getDate();

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  let daysElapsed: number;
  if (month === currentMonth) {
    daysElapsed = today.getDate();
  } else {
    daysElapsed = totalDays;
  }

  // Separate one-time from regular expenses
  // Count occurrences of each merchant/description
  const descCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    const key = (t.merchant || t.description).toLowerCase();
    descCounts[key] = (descCounts[key] || 0) + 1;
  });

  let oneTimeTotal = 0;
  let regularTotal = 0;

  transactions.forEach((t) => {
    const key = (t.merchant || t.description).toLowerCase();
    const amount = Number(t.amount);
    const isOneTimeCategory = ONE_TIME_CATEGORIES.includes(t.category);
    const isLargeOneTime = amount >= ONE_TIME_THRESHOLD && descCounts[key] === 1;

    if (isOneTimeCategory || isLargeOneTime) {
      oneTimeTotal += amount;
    } else {
      regularTotal += amount;
    }
  });

  const currentTotal = oneTimeTotal + regularTotal;

  // Daily average of ONLY regular spending
  const regularDailyAvg = daysElapsed > 0 ? regularTotal / daysElapsed : 0;

  // Prediction = one-time (already happened) + regular projected for full month
  let predictedTotal = oneTimeTotal + (regularDailyAvg * totalDays);

  // Blend with historical data if available (for regular spending portion only)
  if (lastMonthTotal && lastMonthTotal > 0 && daysElapsed < totalDays) {
    const progressRatio = daysElapsed / totalDays;
    // Only blend when early in month — by day 20+, trust current data
    if (progressRatio < 0.7) {
      const blendWeight = 0.3 * (1 - progressRatio); // fades as month progresses
      const historicalAvg = lastMonthTotal;
      predictedTotal = predictedTotal * (1 - blendWeight) + historicalAvg * blendWeight;
    }
  }

  const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0;
  const daysRemaining = totalDays - daysElapsed;

  return {
    currentTotal: Math.round(currentTotal * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    predictedTotal: Math.round(predictedTotal * 100) / 100,
    daysElapsed,
    daysRemaining,
    totalDays,
    oneTimeTotal: Math.round(oneTimeTotal * 100) / 100,
    regularTotal: Math.round(regularTotal * 100) / 100,
  };
}

// Per-category spending prediction with smart separation
// Housing and Subscriptions show as-is (won't grow)
// Other categories project based on daily average
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
    .map(([category, current]) => {
      const isFixedCost = ONE_TIME_CATEGORIES.includes(category);

      let predicted: number;
      if (isFixedCost) {
        // Fixed costs — don't project forward, they won't grow much
        predicted = current;
      } else {
        // Variable costs — project based on daily average
        predicted =
          daysElapsed > 0
            ? Math.round(((current / daysElapsed) * totalDays) * 100) / 100
            : 0;
      }

      return {
        category,
        current: Math.round(current * 100) / 100,
        predicted,
      };
    })
    .sort((a, b) => b.predicted - a.predicted);
}