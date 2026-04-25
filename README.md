# My Compass

> **React Native prototype for Navy career management.** A universal cross-platform application (iOS, Android, Web) built with Expo.

> ⚠️ **Development Status:** This is an offline-first **prototype**. All backend APIs, centralized authentication, and production security controls (including encryption and RBAC) are simulated or deferred pending formal API integration.

---

## Quick Start

```bash
npm install
npx expo start
```

Press **i** for iOS Simulator, **a** for Android Emulator, or **w** for Web.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind for RN) |
| State | Zustand + AsyncStorage persistence |
| Storage | expo-sqlite (local), Supabase (remote) |
| Icons | lucide-react-native |
| Animations | react-native-reanimated |

---

## Project Structure

```
app/                  # Routes (Expo Router file-based)
├── (tabs)/           # Bottom tab navigator
│   ├── (hub)/        #   Home Hub & Menu
│   ├── (admin)/      #   Admin (leave, pay, requests)
│   ├── (assignment)/ #   Assignment cycle & slating
│   ├── (career)/     #   Billet discovery & manifests
│   ├── (pcs)/        #   PCS landing, financials, move
│   ├── (calendar)/   #   Career events calendar
│   ├── (profile)/    #   Profile & preferences
│   └── inbox/        #   Messages & notifications
├── leave/            # Leave request wizard (modal)
├── pcs-wizard/       # PCS segment & HHG wizards (modal)
└── travel-claim/     # DD 1351-2 travel voucher (modal)

components/           # Reusable UI components
├── dashboard/        #   Home Hub cards
├── pcs/              #   PCS: UCT, widgets, financials, wizard steps
├── assignment/       #   Billet discovery & slating widgets
├── travel-claim/     #   Expense cards, receipt uploader
├── wizard/           #   Leave wizard HUD & cards
├── ui/               #   Shared primitives (GlassView, FAB, etc.)
└── ...

store/                # Zustand stores
services/             # API services & SQLite storage layer
types/                # TypeScript types & Zod schemas
utils/                # Utility functions
hooks/                # Custom React hooks
constants/            # App constants & phase definitions
config/               # Environment & feature flags
docs/                 # Developer documentation library
scripts/              # Build & dev scripts
```

---

## Key Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | **Full documentation index** — design standards, security, debt register, feature inventory |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Coding constitution — tech stack rules, anti-hallucination list, Navy conventions |
| [GEMINI.md](GEMINI.md) | AI agent instructions — conventions and constraints |
| [_AI_CONTEXT.xml](_AI_CONTEXT.xml) | System kernel — Zero Trust, PII protection, platform strategy |
| [TIMELINE.md](TIMELINE.md) | UCT implementation plan with agent prompts |

---

## Design Guidelines

- **High-Density UI** — Maximize situational awareness without scrolling (Information density).
- **Continuous Scrolling Forms** — Single-scroll, multi-step wizards for complex data entry.
- **Contextual Widget Framework** — Dynamic component injection based on current lifecycle phase.
- **Offline-First Resilience** — Architecture designed to tolerate intermittent connectivity via local persistence.
- **Domain Terminology** — Standard Navy vernacular: Leave (not Vacation), Detailer (not Recruiter), PRD (not End Date).
