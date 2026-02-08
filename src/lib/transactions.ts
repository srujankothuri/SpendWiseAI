import { supabase } from "./supabase";
import { Transaction } from "../types";

// ============================================
// TRANSACTION SERVICE
// ============================================
// All database operations for transactions live here.
// This keeps database logic separate from UI components.
// Components just call these functions — they don't need
// to know anything about Supabase queries.
//
// Every function includes the user_id filter because
// of our RLS policies — even though RLS protects data
// server-side, filtering client-side avoids unnecessary
// data transfer and makes queries faster.

// Fetch all transactions for a given month
// month format: "2026-02"
export async function getTransactionsByMonth(userId: string, month: string) {
  const startDate = `${month}-01`;
  // Calculate last day of month
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

// Fetch recent transactions (for home screen)
export async function getRecentTransactions(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Transaction[];
}

// Add a new transaction
export async function addTransaction(transaction: {
  user_id: string;
  amount: number;
  description: string;
  category: string;
  merchant: string;
  date: string;
  is_recurring?: boolean;
}) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

// Update an existing transaction
export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "user_id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

// Delete a transaction
export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Get total spending by category for a month
// Used for pie charts and budget tracking
export async function getSpendingByCategory(userId: string, month: string) {
  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  // Group by category and sum amounts
  const categoryTotals: Record<string, number> = {};
  (data || []).forEach((t: { category: string; amount: number }) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Get total spending for a month
export async function getMonthlyTotal(userId: string, month: string) {
  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  return (data || []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
}