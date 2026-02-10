# SpendWiseAI 💰

> AI-powered expense tracking app that learns your spending habits

A cross-platform mobile app that combines smart auto-categorization, AI-powered natural language processing, visual analytics, and budget management to help users take control of their finances.

**[Live on Google Play Store →](#)** *(link coming soon)*

---

## Features

### Smart Expense Tracking
- Add, edit, and delete expenses with an intuitive interface
- Native calendar date picker — prevents future and invalid dates
- Real-time search across descriptions, merchants, and categories
- Category filter chips for quick filtering
- Month-by-month navigation to browse historical spending
- CSV import and export for bulk data management

### AI-Powered Natural Language Entry
Type expenses in plain English — AI extracts the details automatically:
- *"spent 15 bucks at chipotle yesterday"* → Amount: $15, Merchant: Chipotle, Category: Food & Drink, Date: yesterday
- *"uber ride home $23.50"* → Amount: $23.50, Merchant: Uber, Category: Transport
- All AI-parsed fields are editable before saving

### Smart Auto-Categorization (3-Layer System)
1. **Learned Corrections** — App remembers every time you fix a category and applies it automatically next time
2. **Keyword Engine** — Fuzzy matching against category keywords with typo tolerance
3. **AI Fallback** — Groq LLM handles anything the other layers can't

The app gets smarter over time — most categorizations happen instantly without any API call.

### Budget Management
- Set monthly spending limits per category
- Visual progress bars with color-coded status (green → orange → red)
- Real-time alerts when spending hits 80% or exceeds 100% of budget
- Spending forecast that separates fixed costs (rent, subscriptions) from daily variable spending for accurate predictions

### Analytics Dashboard
- **Pie Chart** — Spending breakdown by category with percentages
- **Bar Chart** — Daily spending (horizontally scrollable)
- **Line Chart** — 6-month spending trend
- **Category Projections** — Per-category month-end predictions (fixed costs shown as-is, variable costs projected)
- **AI Insights** — Personalized spending analysis with highlights, warnings, and saving tips
- Month navigation with percentage comparison to previous month

### Additional Features
- Recurring expense auto-detection (weekly, biweekly, monthly patterns)
- Custom category creation with emoji icons, colors, and keywords
- Onboarding screens for first-time users
- Secure authentication with session persistence
- Profile stats and lifetime spending summary
- Demo data loading for testing
- Share app functionality

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React Native + Expo SDK 54 | Cross-platform iOS & Android from single codebase |
| Language | TypeScript | Type safety, better developer experience, fewer runtime errors |
| Navigation | Expo Router | File-based routing — same pattern as Next.js |
| Backend | Supabase (PostgreSQL) | Auth + database + Row Level Security in one platform |
| AI | Groq API (Llama 3.1 8B) | Free tier with 14,400 requests/day, sub-second response times |
| Charts | react-native-chart-kit | Pie, bar, and line charts with customizable styling |
| Secure Storage | expo-secure-store | Encrypted on-device storage for tokens and user preferences |
| Date Picker | @react-native-community/datetimepicker | Native calendar with max date constraints |
| File Handling | expo-file-system + expo-sharing | CSV export/import with native share sheet |

---

## Screenshots

*Coming soon*

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Supabase account (free) — [supabase.com](https://supabase.com)
- Groq API key (free) — [console.groq.com](https://console.groq.com)

### Setup

```bash
git clone https://github.com/srujankothuri/SpendWiseAI.git
cd SpendWiseAI
npm install --legacy-peer-deps
cp .env.example .env
# Add your Supabase and Groq credentials to .env
npx expo start
```

### Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

---

## Future Scope

- Receipt scanning with on-device ML (Google ML Kit)
- Light/Dark theme toggle
- Push notifications for budget alerts
- Multi-currency support with real-time exchange rates
- Bank statement auto-import via Plaid API
- Expense splitting with friends
- Home screen widgets

---

## Author

**Venkata Srujan Kothuri**
MS Computer Science — Northeastern University, Boston

- GitHub: [github.com/srujankothuri](https://github.com/srujankothuri)
- LinkedIn: [linkedin.com/in/srujankothuri](https://linkedin.com/in/srujankothuri)

---

*Built with React Native, Expo, TypeScript, Supabase, and Groq AI*