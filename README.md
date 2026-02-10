# 💰 SpendWiseAI

**Smart expense tracking that learns your habits.**

An AI-powered cross-platform mobile app built with React Native, Expo, Supabase, and Groq AI. Track expenses effortlessly with auto-categorization that gets smarter over time, natural language entry, visual analytics, and intelligent spending predictions.

[![React Native](https://img.shields.io/badge/React_Native-0.76-blue?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<!-- Add Play Store badge once published -->
<!-- [![Google Play](https://img.shields.io/badge/Google_Play-Download-414141?logo=google-play)](YOUR_LINK) -->

---

## 📱 Screenshots

<!-- Replace with actual screenshots -->
| Home | Analytics | Budgets | AI Entry |
|------|-----------|---------|----------|
| *coming soon* | *coming soon* | *coming soon* | *coming soon* |

---

## ✨ Features

### Core
- **Expense CRUD** — Add, edit, delete with calendar date picker
- **Search & Filter** — Real-time search + category filter chips
- **Month Navigation** — Browse spending history month by month
- **CSV Import/Export** — Bulk import from bank statements, export to spreadsheet

### Smart Categorization (3-Layer Engine)
- 🧠 **Learned Corrections** — Remembers every category fix you make
- 🔍 **Keyword Matching** — Fuzzy matching with typo tolerance
- 🤖 **AI Fallback** — Groq LLM handles the rest

### AI-Powered
- **Natural Language Entry** — *"spent 15 bucks at chipotle yesterday"* → auto-parsed
- **Monthly Insights** — AI-generated spending analysis and saving tips

### Analytics & Budgets
- 📊 Pie, bar, and line charts with horizontal scrolling
- 💰 Budget progress bars with 80%/100% alerts
- 📈 Smart predictions that separate fixed costs from daily spending
- 🔄 Automatic recurring expense detection

### More
- Custom category creation (emoji + color + keywords)
- Onboarding flow for new users
- Secure auth with session persistence
- Demo data generator for testing

---

## 🛠 Tech Stack

| | Technology | Purpose |
|---|-----------|---------|
| 📱 | **React Native + Expo** | Cross-platform mobile framework |
| 🔷 | **TypeScript** | Type-safe development |
| 🧭 | **Expo Router** | File-based navigation |
| 🗄️ | **Supabase** | PostgreSQL + Auth + Row Level Security |
| 🤖 | **Groq API** | AI natural language parsing + insights |
| 📊 | **react-native-chart-kit** | Data visualization |
| 🔐 | **expo-secure-store** | Encrypted local storage |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) on your phone
- [Supabase](https://supabase.com) account (free)
- [Groq](https://console.groq.com) API key (free)

### Setup

```bash
# Clone
git clone https://github.com/srujankothuri/SpendWiseAI.git
cd SpendWiseAI

# Install
npm install --legacy-peer-deps

# Configure
cp .env.example .env
# Add your keys to .env

# Run
npx expo start
```

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

### Database Setup
1. Create a Supabase project
2. Run the SQL schema in **SQL Editor** (creates tables, indexes, RLS policies, and triggers)
3. Disable "Confirm email" in Authentication → Providers → Email

---

## 📁 Project Structure

```
app/                     # Screens (file-based routing)
├── (auth)/              # Login, Signup
├── (tabs)/              # Home, Analytics, Budgets, Settings
├── add-transaction.tsx  # Add expense modal
├── ai-entry.tsx         # AI natural language entry
└── onboarding.tsx       # First-time user flow

src/
├── components/          # TransactionCard, BudgetProgressCard, SearchBar
├── lib/                 # Supabase client, API services, Groq client
├── hooks/               # useAuth, useCategories
├── utils/               # Categorization engine, analytics, CSV parser
├── constants/           # Categories, colors
└── types/               # TypeScript interfaces
```

---

## 🔮 Future Scope

- Receipt scanning via Google ML Kit (on-device OCR)
- Push notifications for budget alerts
- Multi-currency with real-time exchange rates
- Bank auto-import via Plaid
- Expense splitting
- Home screen widgets

---

## 👨‍💻 Author

**Venkata Srujan Kothuri**
MS Computer Science — Northeastern University

[![GitHub](https://img.shields.io/badge/GitHub-srujankothuri-181717?logo=github)](https://github.com/srujankothuri)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-srujankothuri-0A66C2?logo=linkedin)](https://linkedin.com/in/srujankothuri)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.