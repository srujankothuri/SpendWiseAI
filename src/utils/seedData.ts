import { supabase } from "../lib/supabase";

// ============================================
// SEED DATA GENERATOR
// ============================================
// Generates 3 months of realistic expense data
// for demo purposes and Play Store screenshots.
//
// The data is designed to look natural:
//   - Realistic amounts for each category
//   - Weekend spending patterns
//   - Recurring subscriptions on the 1st
//   - Varied daily spending

const SEED_TRANSACTIONS = [
  // ===== FEBRUARY 2026 (Current Month) =====
  { date: "2026-02-01", description: "Netflix Monthly", amount: 15.99, category: "Subscriptions", merchant: "Netflix" },
  { date: "2026-02-01", description: "Spotify Premium", amount: 9.99, category: "Subscriptions", merchant: "Spotify" },
  { date: "2026-02-01", description: "Rent Payment", amount: 1200.00, category: "Housing", merchant: "" },
  { date: "2026-02-02", description: "Coffee at Starbucks", amount: 5.75, category: "Food & Drink", merchant: "Starbucks" },
  { date: "2026-02-02", description: "Uber to campus", amount: 8.50, category: "Transport", merchant: "Uber" },
  { date: "2026-02-03", description: "Groceries at Trader Joes", amount: 72.30, category: "Groceries", merchant: "Trader Joes" },
  { date: "2026-02-03", description: "Electric bill", amount: 85.00, category: "Housing", merchant: "" },
  { date: "2026-02-04", description: "Lunch at Chipotle", amount: 12.45, category: "Food & Drink", merchant: "Chipotle" },
  { date: "2026-02-04", description: "Amazon order - USB cable", amount: 14.99, category: "Shopping", merchant: "Amazon" },
  { date: "2026-02-05", description: "Gas station fill up", amount: 42.00, category: "Transport", merchant: "Shell" },
  { date: "2026-02-05", description: "CVS Pharmacy", amount: 18.50, category: "Health", merchant: "CVS" },
  { date: "2026-02-06", description: "Dunkin breakfast", amount: 7.25, category: "Food & Drink", merchant: "Dunkin" },
  { date: "2026-02-06", description: "Movie tickets", amount: 28.00, category: "Entertainment", merchant: "AMC" },
  { date: "2026-02-07", description: "Internet bill", amount: 65.00, category: "Housing", merchant: "Xfinity" },
  { date: "2026-02-07", description: "Whole Foods groceries", amount: 58.90, category: "Groceries", merchant: "Whole Foods" },
  { date: "2026-02-08", description: "Coffee at Dunkin", amount: 4.50, category: "Food & Drink", merchant: "Dunkin" },
  { date: "2026-02-08", description: "Uber ride", amount: 15.75, category: "Transport", merchant: "Uber" },
  { date: "2026-02-09", description: "Target shopping", amount: 45.60, category: "Shopping", merchant: "Target" },

  // ===== JANUARY 2026 =====
  { date: "2026-01-01", description: "Netflix Monthly", amount: 15.99, category: "Subscriptions", merchant: "Netflix" },
  { date: "2026-01-01", description: "Spotify Premium", amount: 9.99, category: "Subscriptions", merchant: "Spotify" },
  { date: "2026-01-01", description: "Rent Payment", amount: 1200.00, category: "Housing", merchant: "" },
  { date: "2026-01-03", description: "Groceries at Trader Joes", amount: 65.80, category: "Groceries", merchant: "Trader Joes" },
  { date: "2026-01-04", description: "Uber to airport", amount: 32.00, category: "Transport", merchant: "Uber" },
  { date: "2026-01-05", description: "Coffee at Starbucks", amount: 6.25, category: "Food & Drink", merchant: "Starbucks" },
  { date: "2026-01-06", description: "Electric bill", amount: 92.00, category: "Housing", merchant: "" },
  { date: "2026-01-07", description: "Lunch at Panera", amount: 14.30, category: "Food & Drink", merchant: "Panera" },
  { date: "2026-01-08", description: "Amazon order - Books", amount: 34.99, category: "Education", merchant: "Amazon" },
  { date: "2026-01-10", description: "Gas station", amount: 38.50, category: "Transport", merchant: "Shell" },
  { date: "2026-01-11", description: "Whole Foods groceries", amount: 82.40, category: "Groceries", merchant: "Whole Foods" },
  { date: "2026-01-12", description: "Dentist copay", amount: 25.00, category: "Health", merchant: "" },
  { date: "2026-01-13", description: "Internet bill", amount: 65.00, category: "Housing", merchant: "Xfinity" },
  { date: "2026-01-14", description: "Dinner with friends", amount: 42.00, category: "Food & Drink", merchant: "" },
  { date: "2026-01-15", description: "T-Mobile phone bill", amount: 55.00, category: "Housing", merchant: "T-Mobile" },
  { date: "2026-01-16", description: "Nike shoes online", amount: 89.99, category: "Shopping", merchant: "Nike" },
  { date: "2026-01-18", description: "Trader Joes groceries", amount: 54.20, category: "Groceries", merchant: "Trader Joes" },
  { date: "2026-01-20", description: "Uber to downtown", amount: 14.50, category: "Transport", merchant: "Uber" },
  { date: "2026-01-22", description: "Coffee at Starbucks", amount: 5.50, category: "Food & Drink", merchant: "Starbucks" },
  { date: "2026-01-24", description: "CVS prescription", amount: 12.00, category: "Health", merchant: "CVS" },
  { date: "2026-01-25", description: "Concert tickets", amount: 65.00, category: "Entertainment", merchant: "" },
  { date: "2026-01-27", description: "Groceries at Aldi", amount: 48.30, category: "Groceries", merchant: "Aldi" },
  { date: "2026-01-29", description: "Parking garage", amount: 15.00, category: "Transport", merchant: "" },
  { date: "2026-01-30", description: "Udemy course", amount: 12.99, category: "Education", merchant: "Udemy" },

  // ===== DECEMBER 2025 =====
  { date: "2025-12-01", description: "Netflix Monthly", amount: 15.99, category: "Subscriptions", merchant: "Netflix" },
  { date: "2025-12-01", description: "Spotify Premium", amount: 9.99, category: "Subscriptions", merchant: "Spotify" },
  { date: "2025-12-01", description: "Rent Payment", amount: 1200.00, category: "Housing", merchant: "" },
  { date: "2025-12-03", description: "Groceries at Whole Foods", amount: 95.60, category: "Groceries", merchant: "Whole Foods" },
  { date: "2025-12-05", description: "Holiday gift - Amazon", amount: 49.99, category: "Shopping", merchant: "Amazon" },
  { date: "2025-12-06", description: "Coffee at Starbucks", amount: 5.50, category: "Food & Drink", merchant: "Starbucks" },
  { date: "2025-12-07", description: "Electric bill", amount: 78.00, category: "Housing", merchant: "" },
  { date: "2025-12-08", description: "Uber rides", amount: 22.00, category: "Transport", merchant: "Uber" },
  { date: "2025-12-10", description: "Holiday gift - Target", amount: 35.00, category: "Shopping", merchant: "Target" },
  { date: "2025-12-12", description: "Dinner out", amount: 55.00, category: "Food & Drink", merchant: "" },
  { date: "2025-12-14", description: "Gas station", amount: 40.00, category: "Transport", merchant: "Shell" },
  { date: "2025-12-15", description: "Internet bill", amount: 65.00, category: "Housing", merchant: "Xfinity" },
  { date: "2025-12-16", description: "Groceries at Trader Joes", amount: 62.40, category: "Groceries", merchant: "Trader Joes" },
  { date: "2025-12-18", description: "Holiday party supplies", amount: 28.00, category: "Shopping", merchant: "Target" },
  { date: "2025-12-20", description: "Pharmacy", amount: 15.00, category: "Health", merchant: "CVS" },
  { date: "2025-12-22", description: "Movie night", amount: 32.00, category: "Entertainment", merchant: "AMC" },
  { date: "2025-12-24", description: "Last minute gifts", amount: 75.00, category: "Shopping", merchant: "Amazon" },
  { date: "2025-12-26", description: "Boxing day sale", amount: 120.00, category: "Shopping", merchant: "Best Buy" },
  { date: "2025-12-28", description: "Groceries", amount: 55.00, category: "Groceries", merchant: "Whole Foods" },
  { date: "2025-12-30", description: "New Year prep", amount: 45.00, category: "Food & Drink", merchant: "" },
];

// Seed budgets for current month
const SEED_BUDGETS = [
  { category: "Food & Drink", monthly_limit: 200, month: "2026-02" },
  { category: "Transport", monthly_limit: 150, month: "2026-02" },
  { category: "Shopping", monthly_limit: 100, month: "2026-02" },
  { category: "Groceries", monthly_limit: 300, month: "2026-02" },
  { category: "Entertainment", monthly_limit: 75, month: "2026-02" },
];

export async function seedDemoData(userId: string): Promise<{
  transactions: number;
  budgets: number;
}> {
  // Insert transactions
  const txnData = SEED_TRANSACTIONS.map((t) => ({
    user_id: userId,
    amount: t.amount,
    description: t.description,
    category: t.category,
    merchant: t.merchant,
    date: t.date,
    is_recurring: false,
  }));

  const { error: txnError } = await supabase
    .from("transactions")
    .insert(txnData);

  if (txnError) throw txnError;

  // Insert budgets
  const budgetData = SEED_BUDGETS.map((b) => ({
    user_id: userId,
    category: b.category,
    monthly_limit: b.monthly_limit,
    month: b.month,
  }));

  const { error: budgetError } = await supabase
    .from("budgets")
    .insert(budgetData);

  if (budgetError) throw budgetError;

  return {
    transactions: SEED_TRANSACTIONS.length,
    budgets: SEED_BUDGETS.length,
  };
}