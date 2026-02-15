# AI Toolkit Task Distribution
## Phase 5: DORMANT Implementation

---

## 🤖 Agent Capabilities Matrix

| Agent | Best For | Avoid For |
|-------|----------|-----------|
| **Claude Code (You)** | Sequential foundations, type systems, store patterns, final polish | Parallel UI work, large file generation |
| **Google Antigravity (Opus 4.6 Thinking)** | Complex UI components, architectural decisions, edge case handling | Simple CRUD, repetitive code |
| **Google Antigravity (Gemini Pro High)** | PDF rendering, platform-specific code, accessibility | Type-heavy logic, Zustand stores |
| **ChatGPT 5.3-codex** | Search algorithms, data transformations, utility functions | React Native styling (prefers web patterns) |
| **Google Jules** | Mock data generation, test fixtures, documentation | Core business logic |

---

## 📋 Task Assignment by Agent

### 🟦 Claude Code (You) — Core Architecture
**Total Time:** 4.5 hours
**Parallelizable:** No (foundation tasks block others)

```bash
SESSION 1: Foundation (3 hrs)
├─ Task 1: Type System Extensions (30 min)
├─ Task 2: Storage Layer Extensions (1.5 hr)
└─ Task 3: Zustand Store Extension (1 hr)

SESSION 4: Migration & Polish (1.5 hrs)
├─ Task 9: Updated PCSArchiveState (30 min)
├─ Task 10: Active → Archive Migration (1 hr)
├─ Task 12: Security Audit (30 min)
└─ Task 13: Accessibility & Animations (45 min - delegate to Gemini if time)
```

**Why Claude Code:**
- Deep understanding of existing codebase patterns
- Familiarity with Zustand/SQLite architecture
- Can ensure consistency with Phase 4 implementation
- Best for blocking tasks that other agents depend on

**Invocation:**
```bash
# Session 1 (run locally)
claude-code "Implement Tasks 1-3 from PHASE_5_IMPLEMENTATION_PLAN.md"

# Session 4 (after all parallel work done)
claude-code "Implement Tasks 9-13 from PHASE_5_IMPLEMENTATION_PLAN.md"
```

---

### 🟩 Google Antigravity — Opus 4.6 Thinking
**Total Time:** 1.5 hours
**Parallelizable:** Yes (Session 3)

```bash
SESSION 3: Complex UI Component
└─ Task 7: Document Folder View (1.5 hr)
   ├─ Modal/route structure
   ├─ Category sections with grouping logic
   ├─ Empty states
   └─ Integration with PDF viewer
```

**Why Opus Thinking:**
- Excels at complex component architecture
- "Thinking" mode handles edge cases (missing categories, empty docs)
- Good at designing intuitive UX flows
- Strong at accessibility considerations

**Prompt Template:**
```
You are implementing Task 7 (Document Folder View) from PHASE_5_IMPLEMENTATION_PLAN.md.

Context:
- Read the full plan at /path/to/PHASE_5_IMPLEMENTATION_PLAN.md
- Review existing patterns: components/pcs/widgets/GainingCommandCard.tsx
- Use GlassView containers, NativeWind styling, Lucide icons
- Must work with expo-router for navigation

Requirements:
1. Create DocumentFolderView.tsx with category sections
2. Group documents by DocumentCategory enum
3. Handle empty states gracefully
4. Integrate with PDFViewerModal (from Task 5)

Constraints:
- React Native primitives only (no HTML)
- Dark mode support required
- Haptics on all interactions
- FlashList for document lists if >10 items

Deliverable: Fully functional component with tests
```

---

### 🟨 Google Antigravity — Gemini Pro High
**Total Time:** 1 hour
**Parallelizable:** Yes (Session 2)

```bash
SESSION 2: Platform-Specific Component
└─ Task 5: PDF Viewer Modal Component (1 hr)
   ├─ Platform detection (iOS/Android/Web)
   ├─ react-native-pdf integration
   ├─ Share functionality
   └─ Loading/error states
```

**Why Gemini Pro:**
- Strong with platform-specific code (Platform.select)
- Good at external library integration (react-native-pdf)
- Excels at WebView/native bridge code
- Fast at modal/overlay patterns

**Prompt Template:**
```
Implement Task 5 (PDF Viewer Modal) from PHASE_5_IMPLEMENTATION_PLAN.md.

Technical Requirements:
- Use react-native-pdf for iOS/Android
- Use <embed> tag for Web fallback
- Share via expo-sharing (shareAsync)
- Full-screen modal with close button

Component API:
interface PDFViewerModalProps {
  visible: boolean;
  document: PCSDocument;
  onClose: () => void;
}

Testing:
- Must work on all 3 platforms
- Share button opens native share sheet
- PDF renders correctly (test with sample file)

Follow patterns from: components/ui/ContextualFAB.tsx (modal example)
```

---

### 🟧 ChatGPT 5.3-codex high
**Total Time:** 2.5 hours
**Parallelizable:** Yes (Sessions 2 & 3)

```bash
SESSION 2: Utilities (1 hr)
└─ Task 4: Document Storage Utilities (1 hr)
   ├─ saveDocumentToPCS()
   ├─ deleteDocument()
   ├─ shareDocument()
   └─ detectDocumentCategory()

SESSION 3: Search & Grid (1 hr)
└─ Task 8: Archive Grid with Search (1 hr)
   ├─ FlashList implementation
   ├─ Search filter logic
   ├─ Filter chips UI
   └─ Empty state

BONUS: PCS Move Card (30 min)
└─ Task 6: PCS Move Card Component
   └─ Clickable card with summary data
```

**Why ChatGPT Codex:**
- Excellent at utility functions and algorithms
- Strong with search/filter logic
- Fast at FlashList/FlatList performance optimization
- Good at TypeScript type guards

**Prompt Template:**
```
Implement Task 4 (Document Storage Utilities) and Task 8 (Archive Grid with Search).

Task 4 Context:
- Extend existing utils/pdfCache.ts pattern
- Create utils/pcsDocumentManager.ts
- Use expo-file-system for local storage
- Integrate with services/storage.ts for SQLite

Task 8 Context:
- Use @shopify/flash-list (not FlatList)
- Search filters: command name, location, fiscal year
- Filter chips pattern: components/ui/FilterChip.tsx (create if needed)
- Real-time search (debounced 300ms)

Performance Targets:
- Grid render: <100ms for 50 items
- Search filter: <50ms latency
- No layout shift during filter

Reference: components/assignment/BilletGrid.tsx (if exists, similar pattern)
```

---

### 🟪 Google Jules
**Total Time:** 45 minutes
**Parallelizable:** Yes (Session 2)

```bash
SESSION 2: Mock Data
└─ Task 11: Mock Historical Data (45 min)
   ├─ Create 3 realistic PCS orders
   ├─ Add 3-5 documents per order
   ├─ Integrate with useDemoStore
   └─ Test data validation
```

**Why Google Jules:**
- Specialized in test data generation
- Understands Navy terminology (from CLAUDE.md)
- Fast at creating realistic fixtures
- Good at edge case data (e.g., OCONUS, Sea Duty)

**Prompt Template:**
```
Create mock historical PCS data for testing (Task 11).

Requirements:
- 3 historical PCS orders across different fiscal years (2022, 2023, 2024)
- Each order has 3-5 documents (Orders, Vouchers, W-2s, Receipts)
- Use realistic Navy command names (USS, NAB, SUBASE)
- Include OCONUS and Sea Duty variations
- Match existing mock pattern: constants/MockPCSData.ts

Document Examples:
- ORDERS: "Official Orders - USS Higgins Transfer.pdf"
- TRAVEL_VOUCHER: "DD 1351-2 - Liquidated 2024-03-15.pdf"
- W2: "W-2 Tax Form - FY 2024.pdf"
- RECEIPT: "Hotel Receipt - TLE Norfolk.pdf"

Export as:
export const MOCK_HISTORICAL_PCS_ORDERS: HistoricalPCSOrder[] = [ ... ];

Integrate into useDemoStore with action: loadMockHistoricalOrders()
```

---

## 🔄 Execution Timeline (Parallel Strategy)

```
HOUR 0-3: FOUNDATION (Sequential)
┌─────────────────────────────────────────┐
│ Claude Code: Tasks 1-3                  │
│ ├─ Types                                │
│ ├─ Storage Layer                        │
│ └─ Zustand Store                        │
└─────────────────────────────────────────┘
          ↓ (checkpoint: types compile)

HOUR 3-5: CORE COMPONENTS (Parallel)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Gemini Pro: Task 5  │ │ Codex: Task 4       │ │ Jules: Task 11      │
│ PDF Viewer Modal    │ │ Document Utils      │ │ Mock Data           │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
          ↓                       ↓                       ↓
          └───────────────────────┴───────────────────────┘
                                  ↓
          (checkpoint: components render in isolation)

HOUR 5-7: UI LAYER (Parallel)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Opus Think: Task 7  │ │ Codex: Task 6 + 8   │ │ Claude: Review      │
│ Folder View         │ │ Card + Grid         │ │ Integration tests   │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
          ↓                       ↓                       ↓
          └───────────────────────┴───────────────────────┘
                                  ↓
          (checkpoint: grid renders with mock data)

HOUR 7-8: POLISH (Sequential)
┌─────────────────────────────────────────┐
│ Claude Code: Tasks 9-13                 │
│ ├─ Archive State Integration            │
│ ├─ Migration Logic                      │
│ ├─ Security Audit                       │
│ └─ Accessibility                        │
└─────────────────────────────────────────┘
          ↓
    COMPLETE ✅
```

---

## 📦 Parallel Invocation Script

**For maximum efficiency, invoke all Session 2 & 3 agents in a single orchestration:**

### Session 2 Parallel Launch (3 agents at once)
```bash
# Terminal 1
google-antigravity gemini-pro \
  --prompt-file prompts/task_5_pdf_viewer.txt \
  --output-dir components/pcs/archive

# Terminal 2
chatgpt-codex \
  --prompt-file prompts/task_4_document_utils.txt \
  --output-dir utils

# Terminal 3
google-jules \
  --prompt-file prompts/task_11_mock_data.txt \
  --output-dir constants
```

### Session 3 Parallel Launch (2 agents)
```bash
# Terminal 1
google-antigravity opus-thinking \
  --prompt-file prompts/task_7_folder_view.txt \
  --output-dir components/pcs/archive

# Terminal 2
chatgpt-codex \
  --prompt-file prompts/task_6_8_grid.txt \
  --output-dir components/pcs/archive
```

---

## ✅ Checkpoint Validation Commands

After each session, run verification:

```bash
# After Session 1 (Foundation)
npx tsc --noEmit
npm run test -- usePCSArchiveStore.test.ts

# After Session 2 (Core Components)
npm run test -- pcsDocumentManager.test.ts
npm run test -- PDFViewerModal.test.tsx

# After Session 3 (UI Layer)
npm run test -- PCSMoveGrid.test.tsx
npm start  # Manual UI verification

# After Session 4 (Polish)
npm run test
npx tsc --noEmit
npm run lint
```

---

## 🔧 Troubleshooting Multi-AI Execution

### Issue: Type Conflicts Between Agents
**Symptom:** Agent B references types that Agent A hasn't committed yet
**Fix:** Run Session 1 (Claude Code) to completion BEFORE starting Session 2

### Issue: File Overwrite Collision
**Symptom:** Two agents modify the same file simultaneously
**Fix:** Ensure tasks have clear file ownership (see plan Task breakdown)

### Issue: Mock Data Doesn't Match Schema
**Symptom:** Jules creates data that fails Zod validation
**Fix:** Give Jules explicit schema to validate against:
```bash
google-jules --validate-schema types/schema.ts:HistoricalPCSOrderSchema
```

### Issue: Platform-Specific Code Breaks on Web
**Symptom:** Gemini uses iOS-only APIs
**Fix:** Provide explicit Platform.select pattern in prompt:
```typescript
Platform.select({
  ios: () => { /* iOS code */ },
  android: () => { /* Android code */ },
  web: () => { /* Web code */ },
})();
```

---

## 📊 Progress Tracking Dashboard

Use this checklist to track multi-agent progress:

```
Foundation Phase (Sequential)
├─ [ ] Task 1: Types defined ✅
├─ [ ] Task 2: SQLite tables created ✅
└─ [ ] Task 3: Zustand store working ✅

Core Components (Parallel)
├─ [ ] Task 4: Document utils implemented (Codex)
├─ [ ] Task 5: PDF viewer working (Gemini)
└─ [ ] Task 11: Mock data loads (Jules)

UI Layer (Parallel)
├─ [ ] Task 6: PCS card renders (Codex)
├─ [ ] Task 7: Folder view functional (Opus)
└─ [ ] Task 8: Grid + search works (Codex)

Polish Phase (Sequential)
├─ [ ] Task 9: Archive state integrated (Claude)
├─ [ ] Task 10: Migration tested (Claude)
├─ [ ] Task 12: Security audit passed (Claude)
└─ [ ] Task 13: Accessibility complete (Claude)
```

---

## 🎯 Agent Success Metrics

### Claude Code (Foundation)
- ✅ Zero TypeScript errors after Session 1
- ✅ All SQLite CRUD operations tested
- ✅ Store persists to AsyncStorage correctly

### Gemini Pro (PDF Viewer)
- ✅ PDF renders on iOS/Android/Web
- ✅ Share button opens native sheet
- ✅ No memory leaks with large PDFs

### ChatGPT Codex (Grid + Utils)
- ✅ Search filter latency <50ms
- ✅ Grid renders 50 items <100ms
- ✅ Document categorization 100% accurate

### Opus Thinking (Folder View)
- ✅ All edge cases handled (empty categories)
- ✅ Navigation flow intuitive
- ✅ Accessibility labels correct

### Google Jules (Mock Data)
- ✅ 3 historical orders validate against schema
- ✅ Documents have realistic filenames
- ✅ Demo mode loads instantly

---

## 🚀 Quick Start for Multi-AI Execution

```bash
# 1. Claude Code runs foundation (local session)
cd /path/to/My_Compass
claude-code "Implement PHASE_5_IMPLEMENTATION_PLAN.md Tasks 1-3"

# 2. Wait for completion, then verify
npx tsc --noEmit

# 3. Launch parallel agents (Session 2)
# Copy prompts from AI_TOOLKIT_DISTRIBUTION.md into each agent interface

# 4. Verify parallel outputs compile together
npx tsc --noEmit

# 5. Launch Session 3 agents
# (Same parallel strategy)

# 6. Claude Code final polish
claude-code "Implement PHASE_5_IMPLEMENTATION_PLAN.md Tasks 9-13"

# 7. Full integration test
npm run test
npm start
```

---

**End of Distribution Guide**
**Generated by:** Claude Code (Sonnet 4.5)
**Date:** 2026-02-13
