// ============================================
// TYPE DEFINITIONS FOR SPENDWISEAI
// ============================================
// These types define the shape of data used
// throughout the app. TypeScript uses these to
// catch errors at compile time — if you try to
// access transaction.name (which doesn't exist),
// TypeScript will flag it before you even run the app.

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;     // what the user typed, e.g. "coffee at starbucks"
  category: string;         // e.g. "Food & Drink"
  merchant: string;         // e.g. "Starbucks"
  date: string;             // ISO date string
  is_recurring: boolean;    // flagged by our recurring detection algorithm
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;         // matches Transaction.category
  monthly_limit: number;    // e.g. 500 for $500/month
  month: string;            // "2026-02" format
}

export interface Category {
  id: string;
  name: string;             // "Food & Drink"
  icon: string;             // emoji for now, e.g. "🍔"
  color: string;            // hex color for charts, e.g. "#e94560"
  keywords: string[];       // ["starbucks", "chipotle", "restaurant", "coffee"]
}

// Used when Gemini AI parses a natural language expense
export interface ParsedExpense {
  amount: number | null;
  merchant: string | null;
  category: string | null;
  date: string | null;
  confidence: number;       // 0-1 score of how confident the AI is
}

// Used for the receipt scanning feature
export interface ReceiptData {
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  name: string;
  price: number;
}

// Used for spending analytics
export interface SpendingSummary {
  total_spent: number;
  by_category: { category: string; amount: number; percentage: number }[];
  daily_average: number;
  compared_to_last_month: number; // percentage change, e.g. +15 or -8
}