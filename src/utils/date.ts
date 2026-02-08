// ============================================
// DATE UTILITIES
// ============================================
// Helper functions for date formatting and manipulation.
// Used throughout the app for displaying dates,
// grouping transactions by day, and month navigation.

// Get current month in "2026-02" format
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Get today's date in "2026-02-08" format
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Format date for display: "Feb 8, 2026"
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format date for grouping: "Today", "Yesterday", or "Feb 8"
export function formatDateGroup(dateString: string): string {
  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateString === today) return "Today";
  if (dateString === yesterdayStr) return "Yesterday";

  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format month for display: "February 2026"
export function formatMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Get previous month: "2026-02" → "2026-01"
export function getPreviousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Get next month: "2026-02" → "2026-03"
export function getNextMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Format currency: 1234.5 → "$1,234.50"
export function formatCurrency(amount: number): string {
  return "$" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}