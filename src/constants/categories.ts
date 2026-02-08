import { Category } from "../types";

// ============================================
// DEFAULT EXPENSE CATEGORIES
// ============================================
// Intentionally kept focused — covers top merchants and
// common terms per category. The app also has:
//   Layer 2: User correction learning (adapts over time)
//   Layer 3: Gemini AI fallback (handles edge cases)
// So this list doesn't need to be exhaustive.

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
      "brunch", "takeout", "panda express", "five guys", "popeyes",
      "kfc", "sushi", "ramen", "thai", "noodle", "ice cream",
      "smoothie", "juice", "dine", "dining", "delivery","brewery", "wine", "beer", "liquor", "cocktail"
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
      "shell", "chevron", "exxon", "bp", "gas station",
      "car rental", "hertz", "enterprise", "bike", "scooter",
      "lime", "bird", "amtrak", "flight", "airline", "commute",
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
      "zara", "h&m", "uniqlo", "ebay", "etsy", "adidas",
      "nordstrom", "macys", "kohls", "home depot", "lowes",
      "ikea", "furniture", "sephora", "ulta", "apple store",
      "shopping", "bought", "purchase", "order", "retail",
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
      "publix", "stop and shop", "stop & shop", "instacart",
      "sprouts", "heb", "meijer", "lidl", "food lion",
      "vegetables", "fruits", "meat", "dairy", "eggs", "milk",
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
      "adobe", "microsoft 365", "paramount", "peacock",
      "planet fitness", "peloton", "headspace", "calm",
      "dropbox", "github", "medium", "patreon", "audible",
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
      "comcast", "xfinity", "spectrum", "verizon", "at&t",
      "t-mobile", "phone bill", "cable", "trash", "hoa",
      "landlord", "lease", "heating", "cooling",
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
      "copay", "urgent care", "lab", "blood test", "checkup",
      "chiropractor", "physical therapy", "mental health",
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
      "festival", "zoo", "aquarium", "arcade", "comedy",
      "books", "bookstore", "hobby", "art", "photography",
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
      "linkedin learning", "skillshare", "certification",
      "training", "workshop", "bootcamp", "semester",
    ],
  },
  {
    id: "other",
    name: "Other",
    icon: "📦",
    color: "#95a5a6",
    keywords: [],
  },
];