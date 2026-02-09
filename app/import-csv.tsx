import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../src/lib/supabase";
import { importTransactionsFromCSV } from "../src/utils/exportImport";
import { COLORS } from "../src/constants/colors";

// ============================================
// CSV IMPORT SCREEN
// ============================================
// User picks a CSV file from their device.
// The app parses it and creates transactions.
//
// Supports flexible CSV formats — looks for
// columns by name (Date, Description, Amount, etc.)
// Auto-categorizes if no category column is present.
//
// Shows a summary after import: X succeeded, Y failed.

export default function ImportCSVScreen() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickFile = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (doc.canceled) return;

      const file = doc.assets[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        Alert.alert("Error", "Please select a CSV file");
        return;
      }

      setFileName(file.name);
      setResult(null);
      await processFile(file.uri);
    } catch (error: any) {
      Alert.alert("Error", "Failed to pick file");
      console.error(error);
    }
  };

  const processFile = async (uri: string) => {
    setImporting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Read file content
      const content = await FileSystem.readAsStringAsync(uri);

      // Import transactions
      const importResult = await importTransactionsFromCSV(
        content,
        user.id
      );

      setResult(importResult);
    } catch (error: any) {
      Alert.alert("Import Failed", error.message || "Could not process CSV");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>
            {result ? "Done" : "Cancel"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import CSV 📄</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>Import from CSV</Text>
        <Text style={styles.instructionText}>
          Upload a CSV file with your transactions. The file should have
          columns for Date, Description, and Amount. Category and Merchant
          columns are optional — we'll auto-categorize if they're missing.
        </Text>
      </View>

      {/* Expected format */}
      <View style={styles.formatCard}>
        <Text style={styles.formatTitle}>Expected format:</Text>
        <Text style={styles.formatCode}>
          Date,Description,Amount,Category,Merchant{"\n"}
          2026-02-01,Netflix,15.99,Subscriptions,Netflix{"\n"}
          2026-02-03,Uber ride,12.50,,Uber{"\n"}
          02/05/2026,Groceries,67.30,,
        </Text>
        <Text style={styles.formatHint}>
          • Date can be YYYY-MM-DD or MM/DD/YYYY{"\n"}
          • Amount can have $ signs and commas{"\n"}
          • Empty category = auto-detected{"\n"}
          • Column order doesn't matter
        </Text>
      </View>

      {/* Pick file button */}
      {!importing && !result && (
        <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
          <Text style={styles.pickIcon}>📁</Text>
          <Text style={styles.pickText}>Select CSV File</Text>
        </TouchableOpacity>
      )}

      {/* Importing indicator */}
      {importing && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Importing {fileName}...
          </Text>
        </View>
      )}

      {/* Import results */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>
            {result.failed === 0 ? "✅" : "⚠️"}
          </Text>
          <Text style={styles.resultTitle}>Import Complete</Text>

          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={[styles.resultStatValue, { color: COLORS.success }]}>
                {result.success}
              </Text>
              <Text style={styles.resultStatLabel}>Imported</Text>
            </View>
            {result.failed > 0 && (
              <View style={styles.resultStat}>
                <Text
                  style={[styles.resultStatValue, { color: COLORS.danger }]}
                >
                  {result.failed}
                </Text>
                <Text style={styles.resultStatLabel}>Failed</Text>
              </View>
            )}
          </View>

          {/* Error details */}
          {result.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Issues:</Text>
              {result.errors.slice(0, 5).map((err: string, i: number) => (
                <Text key={i} style={styles.errorText}>
                  • {err}
                </Text>
              ))}
              {result.errors.length > 5 && (
                <Text style={styles.errorText}>
                  ...and {result.errors.length - 5} more
                </Text>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.importMoreButton}
              onPress={() => {
                setResult(null);
                setFileName(null);
              }}
            >
              <Text style={styles.importMoreText}>Import Another</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  formatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  formatCode: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
    marginBottom: 10,
  },
  formatHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  pickButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  pickIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pickText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  resultStats: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 16,
  },
  resultStat: {
    alignItems: "center",
  },
  resultStatValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  resultStatLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorSection: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.warning,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  importMoreButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  importMoreText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  doneButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  doneText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});