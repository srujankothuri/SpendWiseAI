import { supabase } from "./supabase";
import { Budget } from "../types";

// ============================================
// BUDGET SERVICE
// ============================================
// Handles all database operations for budgets.
// Budgets are per-category, per-month, per-user.
//
// Example: User sets $200/month for Food & Drink in Feb 2026.
// That creates one row: { category: "Food & Drink", monthly_limit: 200, month: "2026-02" }
//
// The unique constraint (user_id, category, month) prevents
// duplicate budgets — if user updates an existing budget,
// we use upsert instead of insert.

// Get all budgets for a specific month
export async function getBudgetsByMonth(userId: string, month: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month);

  if (error) throw error;
  return data as Budget[];
}

// Set or update a budget (upsert)
// "upsert" = insert if new, update if exists
// This is cleaner than checking if budget exists first
// and then deciding to insert or update.
export async function setBudget(budget: {
  user_id: string;
  category: string;
  monthly_limit: number;
  month: string;
}) {
  // Check if budget already exists for this category + month
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", budget.user_id)
    .eq("category", budget.category)
    .eq("month", budget.month)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("budgets")
      .update({ monthly_limit: budget.monthly_limit })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("budgets")
      .insert(budget)
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  }
}

// Delete a budget
export async function deleteBudget(id: string) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Get budget vs actual spending for a month
// This is the key function — it combines budget limits
// with actual spending to show how much is left per category.
export async function getBudgetProgress(userId: string, month: string) {
  // Fetch budgets and transactions in parallel
  // Promise.all runs both queries simultaneously instead of
  // one after the other — cuts load time in half
  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const [budgets, transactions] = await Promise.all([
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month),
    supabase
      .from("transactions")
      .select("category, amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  if (budgets.error) throw budgets.error;
  if (transactions.error) throw transactions.error;

  // Sum spending per category
  const spending: Record<string, number> = {};
  (transactions.data || []).forEach((t: { category: string; amount: number }) => {
    spending[t.category] = (spending[t.category] || 0) + Number(t.amount);
  });

  // Combine budgets with spending
  return (budgets.data || []).map((budget: Budget) => ({
    ...budget,
    spent: spending[budget.category] || 0,
    remaining: budget.monthly_limit - (spending[budget.category] || 0),
    percentage: Math.round(
      ((spending[budget.category] || 0) / budget.monthly_limit) * 100
    ),
  }));
}