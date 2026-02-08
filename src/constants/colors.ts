// ============================================
// APP COLOR THEME
// ============================================
// Centralized color definitions so we can easily
// switch themes or adjust colors app-wide.
// Using a dark theme as the default — modern, 
// easy on the eyes, and looks great in screenshots.

export const COLORS = {
  // Primary palette
  background: "#1a1a2e",      // deep navy - main background
  surface: "#16213e",          // slightly lighter - cards, tab bar
  surfaceLight: "#0f3460",     // borders, dividers
  primary: "#e94560",          // vibrant red-pink - buttons, highlights
  primaryLight: "#ff6b81",     // lighter variant for hover/active states

  // Text
  textPrimary: "#eaeaea",      // main text
  textSecondary: "#a0a0a0",    // secondary/muted text
  textDark: "#1a1a2e",         // text on light backgrounds

  // Status colors
  success: "#2ecc71",          // under budget, positive trends
  warning: "#f39c12",          // approaching budget limit
  danger: "#e74c3c",           // over budget, negative trends
  info: "#3498db",             // informational elements

  // Chart colors (used in pie/bar charts)
  chart: [
    "#e94560", "#0f3460", "#533483", "#2ecc71",
    "#e67e22", "#3498db", "#1abc9c", "#9b59b6",
    "#f39c12", "#95a5a6",
  ],
};