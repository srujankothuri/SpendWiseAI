import { DEFAULT_CATEGORIES } from "../constants/categories";

// ============================================
// AI CLIENT (Groq API)
// ============================================
// Using Groq's free API — blazing fast, generous limits:
//   30 requests/minute, 14,400 requests/day
//   Uses Llama 3 models running on Groq's LPU hardware
//
// Groq uses the OpenAI-compatible API format,
// which means the request/response structure is
// the same as ChatGPT's API — good to know for interviews.
//
// Three features:
//   1. Natural language expense parsing
//   2. Receipt scanning (text-based, no vision)
//   3. Monthly spending insights

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name).join(", ");

// Generic function to call Groq API
// Uses OpenAI-compatible chat completions format
async function callAI(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Groq API key not configured. Check your .env file.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a precise expense parser and financial advisor. Always respond with valid JSON only. No markdown, no explanation, no code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", response.status, errorText);
    throw new Error(`AI error (${response.status}): Please try again.`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return text.trim();
}

// Helper to extract JSON from AI response
function extractJSON(text: string): string {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return cleaned;
}

// ============================================
// FEATURE 1: Natural Language Expense Parsing
// ============================================
export interface ParsedExpenseResult {
  amount: number | null;
  merchant: string | null;
  category: string | null;
  date: string | null;
  description: string;
}

export async function parseNaturalLanguageExpense(
  input: string
): Promise<ParsedExpenseResult> {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Extract expense details from this text.

Text: "${input}"
Today's date: ${today}

Available categories: ${CATEGORY_NAMES}

Respond ONLY with a JSON object:
{
  "amount": <number or null>,
  "merchant": "<store name or null>",
  "category": "<one of the available categories>",
  "date": "<YYYY-MM-DD>",
  "description": "<clean description>"
}

Rules:
- "yesterday" = calculate actual date from today
- "bucks", "dollars", "$" = USD
- Pick the best category from the list
- If no amount found, set null
- If no date mentioned, use today`;

  try {
    const response = await callAI(prompt);
    const json = JSON.parse(extractJSON(response));
    return {
      amount: json.amount,
      merchant: json.merchant,
      category: json.category || "Other",
      date: json.date || today,
      description: json.description || input,
    };
  } catch (error) {
    console.error("Error parsing expense:", error);
    return {
      amount: null,
      merchant: null,
      category: "Other",
      date: today,
      description: input,
    };
  }
}

// ============================================
// FEATURE 2: Monthly Spending Insights
// ============================================
export interface SpendingInsight {
  summary: string;
  highlights: string[];
  warnings: string[];
  tips: string[];
}

export async function generateMonthlyInsights(
  transactions: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }[],
  monthTotal: number,
  lastMonthTotal: number
): Promise<SpendingInsight> {
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    categoryTotals[t.category] =
      (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryBreakdown = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join("\n");

  const prompt = `Analyze this monthly spending data and provide insights.

Total this month: $${monthTotal.toFixed(2)}
Total last month: $${lastMonthTotal.toFixed(2)}
Transactions: ${transactions.length}

Spending by category:
${categoryBreakdown}

Respond ONLY with a JSON object:
{
  "summary": "<2-3 sentence spending summary>",
  "highlights": ["<positive pattern>", "<another>"],
  "warnings": ["<concerning pattern>"],
  "tips": ["<actionable tip>", "<another tip>", "<third tip>"]
}

Rules:
- Reference actual numbers and categories
- 1-2 sentences per point
- 2-3 highlights, 1-2 warnings, 2-3 tips
- Be encouraging but honest
- Tips must be specific and actionable`;

  try {
    const response = await callAI(prompt);
    const json = JSON.parse(extractJSON(response));
    return {
      summary: json.summary || "No insights available.",
      highlights: json.highlights || [],
      warnings: json.warnings || [],
      tips: json.tips || [],
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "Unable to generate insights right now.",
      highlights: [],
      warnings: [],
      tips: [],
    };
  }
}