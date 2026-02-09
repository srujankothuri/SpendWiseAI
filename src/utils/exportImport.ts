import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Transaction } from "../types";
import { supabase } from "../lib/supabase";
import { categorizeExpense } from "./categorize";

// ============================================
// CSV EXPORT
// ============================================
// Converts transactions to CSV format and opens
// the native share sheet so users can save to Files,
// email it, AirDrop, etc.
//
// CSV format is universal — works with Excel,
// Google Sheets, Numbers, and any data tool.

export async function exportTransactionsToCSV(
  transactions: Transaction[]
): Promise<void> {
  if (transactions.length === 0) {
    throw new Error("No transactions to export");
  }

  // CSV header row
  const header = "Date,Description,Amount,Category,Merchant\n";

  // CSV data rows
  // Wrap text fields in quotes to handle commas in descriptions
  const rows = transactions
    .map(
      (t) =>
        `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},"${t.category}","${(t.merchant || "").replace(/"/g, '""')}"`
    )
    .join("\n");

  const csv = header + rows;

  // Generate filename with current date
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `SpendWiseAI_Transactions_${dateStr}.csv`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;

  // Write file to device storage
  await FileSystem.writeAsStringAsync(filepath, csv);

  // Open native share sheet
  // This lets users save to Files, email, AirDrop, etc.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filepath, {
      mimeType: "text/csv",
      dialogTitle: "Export Transactions",
      UTI: "public.comma-separated-values-text",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}

// ============================================
// CSV IMPORT
// ============================================
// Parses a CSV file uploaded by the user and
// creates transactions from it.
//
// Expected CSV format (flexible):
//   Date, Description, Amount, Category (optional), Merchant (optional)
//
// If category is missing, we auto-categorize using
// the keyword engine. This means users can import
// from bank statements that don't have categories.
//
// Handles common CSV quirks:
//   - Quoted fields with commas inside
//   - Different date formats
//   - Dollar signs in amounts
//   - Empty fields

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export async function importTransactionsFromCSV(
  csvContent: string,
  userId: string
): Promise<ImportResult> {
  const lines = csvContent.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  // Parse header to find column positions
  // This makes it flexible — columns can be in any order
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);

  const dateIdx = headers.findIndex((h) =>
    h.includes("date")
  );
  const descIdx = headers.findIndex(
    (h) => h.includes("description") || h.includes("memo") || h.includes("name") || h.includes("detail")
  );
  const amountIdx = headers.findIndex(
    (h) => h.includes("amount") || h.includes("total") || h.includes("value")
  );
  const categoryIdx = headers.findIndex((h) =>
    h.includes("category") || h.includes("type")
  );
  const merchantIdx = headers.findIndex(
    (h) => h.includes("merchant") || h.includes("store") || h.includes("vendor") || h.includes("payee")
  );

  // Validate required columns
  if (amountIdx === -1) {
    throw new Error(
      "CSV must have an 'Amount' column. Found columns: " +
        headers.join(", ")
    );
  }
  if (descIdx === -1 && merchantIdx === -1) {
    throw new Error(
      "CSV must have a 'Description' or 'Merchant' column. Found columns: " +
        headers.join(", ")
    );
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const batch: any[] = [];

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip empty lines

    try {
      const fields = parseCSVLine(line);

      // Extract amount — remove $, commas, handle negatives
      let amountStr = fields[amountIdx] || "";
      amountStr = amountStr.replace(/[$,\s]/g, "").replace(/[()]/g, "-");
      const amount = Math.abs(parseFloat(amountStr));

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i + 1}: Invalid amount "${fields[amountIdx]}"`);
        failed++;
        continue;
      }

      // Extract description
      const description =
        (descIdx >= 0 ? fields[descIdx] : fields[merchantIdx]) || "Imported";

      // Extract date — try to parse various formats
      let date = new Date().toISOString().split("T")[0]; // default to today
      if (dateIdx >= 0 && fields[dateIdx]) {
        const parsed = parseFlexibleDate(fields[dateIdx]);
        if (parsed) date = parsed;
      }

      // Extract or auto-detect category
      let category = "Other";
      if (categoryIdx >= 0 && fields[categoryIdx]) {
        category = fields[categoryIdx].trim();
      } else {
        // Auto-categorize using keyword engine
        const result = categorizeExpense(description);
        if (result.confidence > 0.5) {
          category = result.category;
        }
      }

      // Extract merchant
      const merchant =
        merchantIdx >= 0 ? (fields[merchantIdx] || "").trim() : "";

      batch.push({
        user_id: userId,
        amount,
        description: description.trim(),
        category,
        merchant,
        date,
        is_recurring: false,
      });

      success++;
    } catch (error) {
      errors.push(`Row ${i + 1}: Failed to parse`);
      failed++;
    }
  }

  // Bulk insert all parsed transactions
  if (batch.length > 0) {
    const { error } = await supabase.from("transactions").insert(batch);

    if (error) {
      throw new Error("Database error: " + error.message);
    }
  }

  return { success, failed, errors };
}

// Parse a single CSV line handling quoted fields
// "hello, world",123 → ["hello, world", "123"]
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

// Parse various date formats into YYYY-MM-DD
// Handles: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD,
//          MM-DD-YYYY, Jan 15 2026, etc.
function parseFlexibleDate(dateStr: string): string | null {
  const cleaned = dateStr.trim().replace(/"/g, "");

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const usMatch = cleaned.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try JavaScript's built-in parser as fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}