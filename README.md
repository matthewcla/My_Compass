# My Compass

> **Offline-first career management for Navy service members.** A universal React Native app (iOS, Android, Web) built with Expo.

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
| [CLAUDE.md](CLAUDE.md) | AI agent instructions — conventions and constraints |
| [_AI_CONTEXT.xml](_AI_CONTEXT.xml) | System kernel — Zero Trust, PII protection, platform strategy |
| [TIMELINE.md](TIMELINE.md) | UCT implementation plan with agent prompts |

---

## Design Philosophy

- **Glass Cockpit** — high-density situational awareness, no clutter
- **Tactical Wizard** — single-scroll, continuous-step form flows
- **Smart Stack** — context-aware widget injection per lifecycle phase
- **Offline-First** — works without network (ship-grade reliability)
- **Navy Terminology** — Leave (not Vacation), Detailer (not Recruiter), PRD (not End Date)
