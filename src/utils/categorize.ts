import { DEFAULT_CATEGORIES } from "../constants/categories";

// ============================================
// AUTO-CATEGORIZATION ENGINE
// ============================================
// This is the LOCAL smart categorization system.
// No API calls needed — it runs entirely on the device.
//
// How it works:
// 1. Takes the user's expense description (e.g. "coffee at starbucks")
// 2. Converts to lowercase and splits into words
// 3. Checks each word against every category's keyword list
// 4. Returns the best matching category
//
// It also does fuzzy matching — if you type "starbuks"
// (misspelled), it can still match "starbucks" using
// a simple similarity score (Levenshtein-lite approach).
//
// In interviews, you can explain this as:
// "I built a keyword-based classification engine with
//  fuzzy matching for typo tolerance"

// Calculate similarity between two strings (0 to 1)
// Uses a simplified approach: checks if one string
// contains the other, or measures character overlap
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Character overlap (bigram similarity)
  const getBigrams = (s: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.slice(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let matches = 0;
  bigrams1.forEach((b) => {
    if (bigrams2.has(b)) matches++;
  });

  const total = bigrams1.size + bigrams2.size;
  return total > 0 ? (2 * matches) / total : 0;
}

// Main categorization function
// Returns the category name and confidence score
export function categorizeExpense(description: string): {
  category: string;
  confidence: number;
} {
  if (!description || description.trim().length === 0) {
    return { category: "Other", confidence: 0 };
  }

  const words = description.toLowerCase().split(/\s+/);
  let bestMatch = { category: "Other", confidence: 0 };

  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.keywords.length === 0) continue; // skip "Other"

    for (const word of words) {
      for (const keyword of cat.keywords) {
        // Check exact match first
        if (word === keyword || word.includes(keyword) || keyword.includes(word)) {
          const conf = word === keyword ? 1 : 0.9;
          if (conf > bestMatch.confidence) {
            bestMatch = { category: cat.name, confidence: conf };
          }
        } else {
          // Fuzzy match for typos
          const sim = similarity(word, keyword);
          if (sim > 0.7 && sim > bestMatch.confidence) {
            bestMatch = { category: cat.name, confidence: sim };
          }
        }
      }
    }

    // Also check the full description against keywords
    // This catches multi-word merchants like "taco bell"
    for (const keyword of cat.keywords) {
      if (description.toLowerCase().includes(keyword)) {
        if (0.95 > bestMatch.confidence) {
          bestMatch = { category: cat.name, confidence: 0.95 };
        }
      }
    }
  }

  return bestMatch;
}

// Extract merchant name from description
// Tries to identify the merchant/store name
export function extractMerchant(description: string): string {
  const words = description.toLowerCase().split(/\s+/);

  // Common filler words to remove
  const fillerWords = new Set([
    "at", "for", "on", "the", "a", "an", "to", "from",
    "spent", "paid", "bought", "got", "had", "my",
    "dollars", "bucks", "$", "about", "around",
  ]);

  // Remove filler words and numbers
  const meaningfulWords = words.filter(
    (w) => !fillerWords.has(w) && !/^\d+(\.\d+)?$/.test(w) && w.length > 1
  );

  // Check if any meaningful words match known merchants
  const allKeywords = DEFAULT_CATEGORIES.flatMap((c) => c.keywords);
  const matchedMerchant = meaningfulWords.find((w) =>
    allKeywords.some(
      (k) => k.includes(w) || w.includes(k) || similarity(w, k) > 0.8
    )
  );

  if (matchedMerchant) {
    // Capitalize first letter
    return matchedMerchant.charAt(0).toUpperCase() + matchedMerchant.slice(1);
  }

  // If no known merchant, return first meaningful word capitalized
  if (meaningfulWords.length > 0) {
    const merchant = meaningfulWords[0];
    return merchant.charAt(0).toUpperCase() + merchant.slice(1);
  }

  return "";
}