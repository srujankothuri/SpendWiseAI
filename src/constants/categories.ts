import { Category } from "../types";

// ============================================
// DEFAULT EXPENSE CATEGORIES
// ============================================
// These are the built-in categories with keyword mappings.
// The keywords power the LOCAL auto-categorization engine —
// when a user types "uber ride home", the engine matches
// "uber" to Transport without any AI API call.
//
// Users can also create custom categories later.

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Food & Drink",
    icon: "🍔",
    color: "#e94560",
    keywords: [
      "starbucks", "coffee", "chipotle", "mcdonalds", "restaurant",
      "pizza", "burger", "lunch", "dinner", "breakfast", "doordash",
      "ubereats", "grubhub", "cafe", "bakery", "dunkin", "subway",
      "wendys", "chick-fil-a", "panera", "dominos", "taco bell",
      "food", "eat", "meal", "snack", "drink", "bar", "pub",
    ],
  },
  {
    id: "transport",
    name: "Transport",
    icon: "🚗",
    color: "#0f3460",
    keywords: [
      "uber", "lyft", "gas", "fuel", "parking", "toll", "bus",
      "subway", "metro", "train", "taxi", "car wash", "oil change",
      "mechanic", "auto", "vehicle", "mbta", "transit",
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    color: "#533483",
    keywords: [
      "amazon", "walmart", "target", "costco", "best buy", "nike",
      "clothes", "shoes", "electronics", "online", "store", "mall",
      "zara", "h&m", "uniqlo", "ebay", "etsy",
    ],
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "🛒",
    color: "#2ecc71",
    keywords: [
      "whole foods", "trader joes", "kroger", "aldi", "grocery",
      "supermarket", "market", "produce", "wegmans", "safeway",
      "publix", "stop and shop", "stop & shop",
    ],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "📱",
    color: "#e67e22",
    keywords: [
      "netflix", "spotify", "hulu", "disney", "hbo", "youtube",
      "apple music", "amazon prime", "subscription", "membership",
      "gym", "icloud", "google one", "chatgpt", "openai",
    ],
  },
  {
    id: "housing",
    name: "Housing",
    icon: "🏠",
    color: "#3498db",
    keywords: [
      "rent", "mortgage", "electric", "electricity", "water",
      "gas bill", "internet", "wifi", "utility", "utilities",
      "insurance", "maintenance", "repair", "plumber",
    ],
  },
  {
    id: "health",
    name: "Health",
    icon: "🏥",
    color: "#1abc9c",
    keywords: [
      "doctor", "hospital", "pharmacy", "cvs", "walgreens",
      "medicine", "prescription", "dental", "dentist", "eye",
      "optometrist", "therapy", "medical", "health", "clinic",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    color: "#9b59b6",
    keywords: [
      "movie", "cinema", "theater", "concert", "game", "games",
      "steam", "playstation", "xbox", "nintendo", "ticket",
      "event", "museum", "amusement", "bowling", "sports",
    ],
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    color: "#f39c12",
    keywords: [
      "tuition", "book", "books", "course", "udemy", "coursera",
      "university", "college", "school", "textbook", "class",
      "tutorial", "learning", "exam", "test prep",
    ],
  },
  {
    id: "other",
    name: "Other",
    icon: "📦",
    color: "#95a5a6",
    keywords: [],  // catch-all for anything that doesn't match
  },
];