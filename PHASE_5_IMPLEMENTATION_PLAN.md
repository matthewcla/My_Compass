# Phase 5: DORMANT — The Digital Sea Bag
## Multi-AI Parallelized Implementation Plan

---

## 📋 Executive Summary

**Phase 5** transforms the PCS tab from an active relocation manager into a **digital document archive** after move completion. When `phase === 'DORMANT'` (no active segments), sailors access a searchable grid of past PCS moves, each containing stamped orders, W-2s, travel vouchers, and receipts—eliminating the need for CAC-enabled BOL logins.

**Current State:** `PCSArchiveState.tsx` shows placeholder text ("Digital Sea Bag") with static info cards.
**Target State:** Interactive archive grid with document folders, search, filtering, and secure document viewer.

**Timeline (Parallelized):** 6-8 hours across 4 AI agents
**Timeline (Sequential):** 18-20 hours for 1 developer

---

## 🎯 Success Criteria

✅ Historical PCS orders persist in SQLite with encryption
✅ Document categorization (Orders, Vouchers, W-2s, Receipts)
✅ Grid view with search/filter (by year, location, command)
✅ Tap PCS move → opens document folder view
✅ PDF viewer with share/download functionality
✅ Works offline (all documents cached locally)
✅ Zero PII in logs, encrypted storage for sensitive docs
✅ Demo mode with 3 historical PCS moves

---

## 🏗️ Architecture Overview

### Data Model Extension

```typescript
// types/pcs.ts — NEW

export type DocumentCategory =
  | 'ORDERS'          // Stamped official orders PDF
  | 'TRAVEL_VOUCHER'  // DD 1351-2 (liquidated claim)
  | 'W2'              // Annual W-2 tax form
  | 'RECEIPT'         // Individual expense receipts
  | 'OTHER';          // Miscellaneous documents

export interface PCSDocument {
  id: string;
  pcsOrderId: string;              // Links to HistoricalPCSOrder
  category: DocumentCategory;
  filename: string;                 // e.g., "orders_2024_001.pdf"
  displayName: string;              // User-friendly name
  localUri: string;                 // File system path
  originalUrl?: string;             // Source URL (for re-download)
  sizeBytes: number;
  uploadedAt: string;               // ISO timestamp
  metadata?: Record<string, any>;   // Optional: OCR text, tags
}

export interface HistoricalPCSOrder {
  id: string;                       // "pcs-2024-001"
  orderNumber: string;              // "ORD-2024-001"
  userId: string;

  // Collapsed segments into summary
  originCommand: string;            // "USS Gridley (DDG-101)"
  originLocation: string;           // "Everett, WA"
  gainingCommand: string;           // "USS Higgins (DDG-76)"
  gainingLocation: string;          // "Yokosuka, Japan"

  // Dates
  departureDate: string;            // First segment departure
  arrivalDate: string;              // Last segment arrival
  fiscalYear: number;               // 2024 (derived from departure)

  // Financial summary
  totalMalt: number;
  totalPerDiem: number;
  totalReimbursement: number;       // From liquidated travel voucher

  // Documents
  documents: PCSDocument[];

  // Status
  status: 'ACTIVE' | 'ARCHIVED';    // ARCHIVED when fully complete
  archivedAt?: string;

  // Legacy compatibility
  isOconus: boolean;
  isSeaDuty: boolean;
}
```

### Storage Layer

**SQLite Tables (services/storage.ts):**
```sql
CREATE TABLE IF NOT EXISTS historical_pcs_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  origin_command TEXT,
  origin_location TEXT,
  gaining_command TEXT,
  gaining_location TEXT,
  departure_date TEXT,
  arrival_date TEXT,
  fiscal_year INTEGER,
  total_malt REAL,
  total_per_diem REAL,
  total_reimbursement REAL,
  is_oconus INTEGER,
  is_sea_duty INTEGER,
  status TEXT,
  archived_at TEXT,
  last_sync_timestamp TEXT,
  sync_status TEXT
);

CREATE TABLE IF NOT EXISTS pcs_documents (
  id TEXT PRIMARY KEY,
  pcs_order_id TEXT NOT NULL,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  display_name TEXT,
  local_uri TEXT,
  original_url TEXT,
  size_bytes INTEGER,
  uploaded_at TEXT,
  metadata TEXT,  -- JSON
  FOREIGN KEY (pcs_order_id) REFERENCES historical_pcs_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_historical_pcs_user_id ON historical_pcs_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pcs_documents_order_id ON pcs_documents(pcs_order_id);
```

### Component Hierarchy

```
PCSArchiveState.tsx (updated)
├── ArchiveHeader.tsx (search, filter controls)
├── PCSMoveGrid.tsx (FlashList of cards)
│   └── PCSMoveCard.tsx (clickable card with summary)
├── DocumentFolderView.tsx (modal/route for single PCS)
│   ├── DocumentCategorySection.tsx (Orders, Vouchers, etc.)
│   │   └── DocumentListItem.tsx (tap to open PDF)
│   └── PDFViewerModal.tsx (full-screen viewer with share)
└── EmptyArchiveState.tsx (shown when no history)
```

---

## 📦 Task Breakdown (Parallelizable)

### 🔷 FOUNDATION PHASE (Sequential — Blocking)

#### **Task 1: Type System Extensions** (30 min)
**Agent:** Claude Code
**Files:** `types/pcs.ts`, `types/schema.ts`

**Deliverables:**
1. Add `DocumentCategory`, `PCSDocument`, `HistoricalPCSOrder` to `types/pcs.ts`
2. Create Zod schemas in `types/schema.ts`:
   ```typescript
   export const PCSDocumentSchema = z.object({ ... });
   export const HistoricalPCSOrderSchema = z.object({ ... });
   ```

**Verification:**
- TypeScript compiles with zero errors
- Schemas validate correctly with test data

---

#### **Task 2: Storage Layer Extensions** (1.5 hr)
**Agent:** Claude Code or ChatGPT 5.3-codex
**Files:** `services/storage.ts`, `types/schema.ts`

**Deliverables:**
1. Add SQL table definitions to `initializeSQLiteTables()`
2. Implement CRUD operations:
   ```typescript
   interface IStorageService {
     // Historical PCS Orders
     saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void>;
     getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]>;
     getHistoricalPCSOrder(id: string): Promise<HistoricalPCSOrder | null>;
     deleteHistoricalPCSOrder(id: string): Promise<void>;

     // PCS Documents
     savePCSDocument(doc: PCSDocument): Promise<void>;
     getPCSDocuments(pcsOrderId: string): Promise<PCSDocument[]>;
     deletePCSDocument(docId: string): Promise<void>;
   }
   ```
3. Add mock implementations for `MockStorage` and `WebStorage`
4. Use encryption for sensitive document metadata

**Verification:**
- Tables created successfully in SQLite
- CRUD operations work with test data
- Foreign key cascade delete works

---

#### **Task 3: Zustand Store Extension** (1 hr)
**Agent:** Claude Code
**Files:** `store/usePCSArchiveStore.ts` (NEW)

**Deliverables:**
1. Create new store for archive management:
   ```typescript
   interface PCSArchiveState {
     historicalOrders: HistoricalPCSOrder[];
     selectedOrder: HistoricalPCSOrder | null;
     searchQuery: string;
     filterYear: number | null;
     filterLocation: string | null;

     fetchHistoricalOrders: (userId: string) => Promise<void>;
     archiveActiveOrder: () => Promise<void>;  // Converts active → historical
     selectOrder: (orderId: string) => void;
     setSearchQuery: (query: string) => void;
     setFilterYear: (year: number | null) => void;
     setFilterLocation: (location: string | null) => void;
   }
   ```
2. Add selector hooks:
   ```typescript
   export const useFilteredHistoricalOrders = () => { ... };
   export const useSelectedOrderDocuments = () => { ... };
   ```

**Verification:**
- Store persists to AsyncStorage
- Filters apply correctly
- `archiveActiveOrder()` migrates data from `usePCSStore` to archive

---

### 🔶 DOCUMENT MANAGEMENT PHASE (Parallel)

#### **Task 4: Document Storage Utilities** (1 hr)
**Agent:** Google Jules or ChatGPT 5.3-codex
**Files:** `utils/pcsDocumentManager.ts` (NEW)

**Deliverables:**
1. Extend `pdfCache.ts` pattern for PCS-specific documents:
   ```typescript
   export async function saveDocumentToPCS(
     pcsOrderId: string,
     category: DocumentCategory,
     fileUri: string,
     displayName: string
   ): Promise<PCSDocument>;

   export async function deleteDocument(docId: string): Promise<void>;

   export async function shareDocument(doc: PCSDocument): Promise<void>;

   // Auto-categorize uploaded PDFs
   export function detectDocumentCategory(filename: string): DocumentCategory;
   ```
2. Implement auto-categorization heuristics:
   - `orders_*.pdf` → ORDERS
   - `DD_1351_2_*.pdf` → TRAVEL_VOUCHER
   - `W2_*.pdf` → W2
   - `receipt_*.pdf` → RECEIPT

**Verification:**
- Documents save to correct file system path
- Metadata persists to SQLite
- Share opens native share sheet

---

#### **Task 5: PDF Viewer Modal Component** (1 hr)
**Agent:** Google Antigravity (Gemini Pro)
**Files:** `components/pcs/archive/PDFViewerModal.tsx` (NEW)

**Deliverables:**
1. Full-screen PDF viewer with controls:
   - Powered by `expo-file-system` + WebView or react-native-pdf
   - Share button (calls `shareDocument()`)
   - Close button
   - Document title in header
2. Platform-specific rendering:
   - iOS/Android: `<Pdf source={{ uri: localUri }} />`
   - Web: `<embed src={localUri} type="application/pdf" />`
3. Loading/error states

**Verification:**
- PDFs render correctly on all platforms
- Share button works (tested on iOS/Android)
- Back button closes modal

---

### 🔷 UI COMPONENTS PHASE (Parallel)

#### **Task 6: PCS Move Card Component** (45 min)
**Agent:** Claude Code
**Files:** `components/pcs/archive/PCSMoveCard.tsx` (NEW)

**Deliverables:**
1. Card displaying historical move summary:
   ```tsx
   <GlassView>
     <View className="p-4">
       {/* Header: Origin → Gaining (with flag icons) */}
       <Text>USS Gridley → USS Higgins</Text>
       <Text>Everett, WA → Yokosuka, Japan</Text>

       {/* Dates */}
       <Text>Aug 2024 - Oct 2024</Text>

       {/* Document count badge */}
       <Badge>8 documents</Badge>

       {/* Tap target */}
     </View>
   </GlassView>
   ```
2. Tap handler navigates to `DocumentFolderView`
3. Badges for OCONUS, Sea Duty
4. Haptics on press

**Verification:**
- Cards render in grid (FlashList)
- Tap navigates correctly
- Dark mode support

---

#### **Task 7: Document Folder View** (1.5 hr)
**Agent:** Google Antigravity (Claude Opus 4.6 Thinking)
**Files:** `components/pcs/archive/DocumentFolderView.tsx` (NEW)

**Deliverables:**
1. Modal or full-screen route showing documents grouped by category:
   ```tsx
   <ScrollView>
     <ArchiveHeader order={selectedOrder} />

     <DocumentCategorySection
       title="Official Orders"
       category="ORDERS"
       documents={ordersDocuments}
     />

     <DocumentCategorySection
       title="Travel Vouchers"
       category="TRAVEL_VOUCHER"
       documents={voucherDocuments}
     />

     <DocumentCategorySection
       title="W-2 Forms"
       category="W2"
       documents={w2Documents}
     />

     <DocumentCategorySection
       title="Receipts"
       category="RECEIPT"
       documents={receiptDocuments}
     />
   </ScrollView>
   ```
2. Empty states for missing categories
3. Tap document → opens `PDFViewerModal`
4. Back button returns to grid

**Verification:**
- Categories render correctly
- Tap opens PDF viewer
- Empty states show when no docs

---

#### **Task 8: Archive Grid with Search** (1 hr)
**Agent:** ChatGPT 5.3-codex
**Files:** `components/pcs/archive/PCSMoveGrid.tsx`, `components/pcs/archive/ArchiveSearchBar.tsx` (NEW)

**Deliverables:**
1. FlashList grid of `PCSMoveCard` components
2. Search bar filtering by:
   - Command name (origin or gaining)
   - Location (city/state)
   - Fiscal year
3. Filter chips UI:
   ```tsx
   <View className="flex-row gap-2">
     <FilterChip label="2024" onPress={() => setFilterYear(2024)} />
     <FilterChip label="OCONUS Only" onPress={() => setFilterOconus(true)} />
   </View>
   ```
4. Empty state when no results

**Verification:**
- Search filters correctly
- Filters apply in real-time
- Performance good with 10+ historical orders

---

#### **Task 9: Updated PCSArchiveState** (30 min)
**Agent:** Claude Code
**Files:** `components/pcs/states/PCSArchiveState.tsx`

**Deliverables:**
1. Replace placeholder text with conditional rendering:
   ```tsx
   {historicalOrders.length > 0 ? (
     <>
       <ArchiveSearchBar />
       <PCSMoveGrid orders={filteredOrders} />
     </>
   ) : (
     <EmptyArchiveState />
   )}
   ```
2. Integrate `usePCSArchiveStore`
3. Maintain FadeIn/FadeOut animations

**Verification:**
- Renders grid when historical data exists
- Shows empty state when no data
- Animations smooth

---

### 🔶 DATA MIGRATION & DEMO PHASE (Parallel)

#### **Task 10: Active → Archive Migration** (1 hr)
**Agent:** Claude Code
**Files:** `store/usePCSArchiveStore.ts`, `utils/pcsArchiveMigration.ts` (NEW)

**Deliverables:**
1. Implement `archiveActiveOrder()` function:
   ```typescript
   // Triggered when all segments reach COMPLETE + 90 days post-arrival
   async function archiveActiveOrder() {
     const activeOrder = usePCSStore.getState().activeOrder;
     const cachedOrders = usePCSStore.getState().cachedOrders;

     // 1. Create HistoricalPCSOrder from active data
     const historical: HistoricalPCSOrder = {
       id: `pcs-${Date.now()}`,
       orderNumber: activeOrder.orderNumber,
       originCommand: activeOrder.segments[0].location.name,
       gainingCommand: activeOrder.gainingCommand.name,
       // ... map all fields
       documents: [],
       status: 'ARCHIVED',
     };

     // 2. Convert cached PDF to PCSDocument
     if (cachedOrders) {
       const ordersDoc: PCSDocument = {
         id: generateUUID(),
         pcsOrderId: historical.id,
         category: 'ORDERS',
         filename: cachedOrders.filename,
         localUri: cachedOrders.localUri,
         // ...
       };
       historical.documents.push(ordersDoc);
     }

     // 3. Save to archive store + SQLite
     await storage.saveHistoricalPCSOrder(historical);

     // 4. Clear active order
     usePCSStore.getState().resetPCS();
   }
   ```
2. Add auto-archive trigger (90 days post-arrival check)

**Verification:**
- Active order converts to historical correctly
- Documents migrate successfully
- Active order cleared after archive

---

#### **Task 11: Mock Historical Data** (45 min)
**Agent:** Google Jules
**Files:** `constants/MockPCSArchive.ts` (NEW), `store/useDemoStore.ts`

**Deliverables:**
1. Create 3 mock historical PCS orders:
   ```typescript
   export const MOCK_HISTORICAL_PCS_ORDERS: HistoricalPCSOrder[] = [
     {
       id: 'pcs-2024-001',
       orderNumber: 'ORD-2024-001',
       userId: 'demo-user-1',
       originCommand: 'USS Michigan (SSGN-727)',
       originLocation: 'Bremerton, WA',
       gainingCommand: 'SUBASE New London',
       gainingLocation: 'Groton, CT',
       departureDate: '2024-01-15',
       arrivalDate: '2024-02-10',
       fiscalYear: 2024,
       totalMalt: 2845.50,
       totalPerDiem: 1240.00,
       totalReimbursement: 4850.25,
       isOconus: false,
       isSeaDuty: true,
       status: 'ARCHIVED',
       archivedAt: '2024-05-15T00:00:00.000Z',
       documents: [
         {
           id: 'doc-001',
           pcsOrderId: 'pcs-2024-001',
           category: 'ORDERS',
           filename: 'orders_2024_001.pdf',
           displayName: 'Official Orders - New London Transfer',
           localUri: 'file://mock/orders_2024_001.pdf',
           sizeBytes: 245000,
           uploadedAt: '2024-01-10T00:00:00.000Z',
         },
         // ... more documents
       ],
     },
     // ... 2 more historical orders
   ];
   ```
2. Add demo action to `useDemoStore`:
   ```typescript
   loadMockHistoricalOrders: () => {
     usePCSArchiveStore.getState().setHistoricalOrders(MOCK_HISTORICAL_PCS_ORDERS);
   };
   ```

**Verification:**
- 3 historical orders load in demo mode
- Each has 3-5 documents
- Grid renders correctly

---

### 🔷 POLISH & SECURITY PHASE (Sequential)

#### **Task 12: Security Audit** (30 min)
**Agent:** Claude Code
**Files:** All new files

**Deliverables:**
1. Verify no PII in logs (use `SecureLogger`)
2. Ensure sensitive document metadata encrypted in SQLite
3. Validate file paths don't expose user data
4. Add input sanitization for search queries

**Verification:**
- `npm run audit-logs` passes (custom script)
- No PII leaks in console
- SQLite PRAGMA secure_delete enabled

---

#### **Task 13: Accessibility & Animations** (45 min)
**Agent:** Google Antigravity (Gemini Pro)
**Files:** All new components

**Deliverables:**
1. Add accessibility labels:
   - `accessibilityLabel="PCS move from USS Gridley to USS Higgins, August 2024"`
   - `accessibilityHint="Tap to view documents"`
2. Add Layout.springify() to grid items
3. FadeIn/FadeOut for modal transitions
4. Haptics on all pressable elements

**Verification:**
- VoiceOver/TalkBack announce correctly
- Animations smooth on low-end devices
- Haptics work on iOS/Android

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
```typescript
// __tests__/usePCSArchiveStore.test.ts
describe('PCSArchiveStore', () => {
  it('filters by fiscal year', () => { ... });
  it('searches by command name', () => { ... });
  it('archives active order correctly', () => { ... });
});

// __tests__/pcsDocumentManager.test.ts
describe('Document Manager', () => {
  it('detects document category from filename', () => { ... });
  it('saves document to correct path', () => { ... });
});
```

### Integration Tests
1. **Archive Flow:** Active PCS → 90 days → auto-archive → grid view
2. **Document Upload:** Add PDF → categorize → view in folder
3. **Search:** Type command → filter results → tap card → view docs

### Manual Testing Checklist
- [ ] Grid renders 10+ historical orders smoothly (FlashList)
- [ ] Search filters update in real-time
- [ ] PDF viewer opens on all platforms (iOS/Android/Web)
- [ ] Share sheet works for PDFs
- [ ] Offline mode: all cached docs accessible
- [ ] Demo mode loads 3 mock historical orders
- [ ] Dark mode: all components themed correctly
- [ ] Haptics work on all pressable elements

---

## 🚀 Deployment Plan

### Pre-Deployment
1. Run type check: `npx tsc --noEmit`
2. Run tests: `npx jest`
3. Test on all platforms: iOS, Android, Web
4. Verify SQLite migrations work

### Migration Strategy
**For existing users with active PCS orders:**
- Add background job to check for orders >90 days past arrival
- Show banner: "Your 2024 San Diego move is ready to archive"
- User taps "Archive Now" → triggers `archiveActiveOrder()`

### Rollout Phases
1. **Alpha (Week 1):** Internal testing with mock data
2. **Beta (Week 2-3):** 50 sailors with real historical orders
3. **GA (Week 4):** Full release with migration notifications

---

## 📊 Multi-AI Execution Strategy

### Session 1: Foundation (Sequential — 3 hrs)
**Claude Code** runs Tasks 1-3 sequentially (blocking for all others)

### Session 2: Core Components (Parallel — 2.5 hrs)
Launch in single message with multiple `<invoke name="Task">` blocks:
- **Google Antigravity (Gemini Pro):** Task 5 (PDF Viewer)
- **ChatGPT 5.3-codex:** Task 4 (Document Manager)
- **Google Jules:** Task 11 (Mock Data)

### Session 3: UI Layer (Parallel — 2 hrs)
Launch in parallel:
- **Claude Code:** Tasks 6, 9 (Card, Archive State)
- **Google Antigravity (Opus Thinking):** Task 7 (Folder View)
- **ChatGPT 5.3-codex:** Task 8 (Grid + Search)

### Session 4: Migration & Polish (Sequential — 1.5 hrs)
**Claude Code** runs Tasks 10, 12, 13

---

## 🎨 Design Patterns & Conventions

### File Naming
- **Stores:** `usePCSArchiveStore.ts`
- **Components:** `PCSMoveCard.tsx`, `DocumentFolderView.tsx`
- **Utils:** `pcsDocumentManager.ts`, `pcsArchiveMigration.ts`
- **Types:** Extend `types/pcs.ts` (no new file)

### Component Pattern (Strict)
```tsx
import { View, Text } from 'react-native'; // NO HTML elements
import { GlassView } from '@/components/ui/GlassView';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { FileText } from 'lucide-react-native';

export function PCSMoveCard({ order }: { order: HistoricalPCSOrder }) {
  return (
    <GlassView className="rounded-2xl p-4">
      <View className="flex-row items-center gap-3">
        <FileText size={20} color="#3b82f6" />
        <Text className="text-lg font-bold dark:text-white">
          {order.originCommand} → {order.gainingCommand}
        </Text>
      </View>
    </GlassView>
  );
}
```

### Storage Pattern
```typescript
// Always use IStorageService interface
await storage.saveHistoricalPCSOrder(order);
const orders = await storage.getUserHistoricalPCSOrders(userId);
```

### Encryption Pattern
```typescript
import { encryptData, decryptData } from '@/lib/encryption';

// Encrypt sensitive metadata before SQLite insert
const encrypted = encryptData(JSON.stringify(metadata));
await db.runAsync('INSERT INTO pcs_documents (metadata) VALUES (?)', encrypted);

// Decrypt on read
const decrypted = decryptData(row.metadata);
const metadata = JSON.parse(decrypted);
```

---

## 🔒 Security Considerations

### PII Protection
- **Document metadata:** Encrypted in SQLite (contains names, addresses)
- **Search queries:** Sanitized to prevent SQL injection
- **Logs:** Use `SecureLogger` to auto-redact SSN/DoD ID patterns
- **File paths:** Use UUIDs, not DoD IDs (e.g., `pcs-2024-001`, not `1234567890`)

### Document Access Control
- **User isolation:** SQLite queries filter by `user_id`
- **Document deletion:** Cascade delete removes files + metadata
- **Share permissions:** Native share sheet (user controls recipients)

### Offline Security
- **SQLite encryption:** `PRAGMA key = '<master_key>'` (from SecureStore)
- **File system:** Documents in app sandbox (iOS/Android)
- **Web fallback:** localStorage encrypted via `encryptData()`

---

## 🐛 Known Risks & Mitigation

### Risk 1: Large Document Archives (100+ PDFs)
**Mitigation:**
- FlashList pagination (50 items per page)
- Lazy-load document thumbnails
- Archive older moves (>5 years) to cold storage

### Risk 2: PDF Rendering Fails on Web
**Mitigation:**
- Fallback to `<embed>` tag if WebView unavailable
- Show "Download PDF" button as last resort

### Risk 3: SQLite Migration Failures
**Mitigation:**
- Schema versioning (PRAGMA user_version)
- Backup before migration
- Rollback on error

### Risk 4: Auto-Archive Triggers Too Early
**Mitigation:**
- Require manual confirmation (banner notification)
- Allow "Undo" within 24 hours
- Store in `pending_archive` table first

---

## 📈 Performance Targets

- **Grid render:** <100ms for 50 items (FlashList)
- **Search filter:** <50ms latency
- **PDF open:** <500ms (cached), <2s (download)
- **Archive migration:** <3s for average PCS order
- **SQLite query:** <10ms for historical orders fetch

---

## 🎓 Learning Resources for AI Agents

Before starting, agents should review:
1. **CLAUDE.md** — Project conventions (React Native, NativeWind, no HTML)
2. **utils/pdfCache.ts** — Existing PDF management pattern
3. **services/storage.ts** — SQLite CRUD pattern
4. **components/pcs/widgets/GainingCommandCard.tsx** — GlassView reference
5. **Phase 4 Implementation** (completed) — Widget patterns

---

## ✅ Final Deliverable Checklist

### Code Quality
- [ ] TypeScript compiles with zero errors
- [ ] All components follow React Native primitives (no `<div>`, `<span>`)
- [ ] NativeWind classes used (no inline styles)
- [ ] Zustand selectors prevent unnecessary re-renders
- [ ] Encryption used for sensitive data

### Functionality
- [ ] Grid displays historical PCS orders
- [ ] Search/filter works correctly
- [ ] Tap card → opens document folder
- [ ] Tap document → opens PDF viewer
- [ ] Share button works on iOS/Android
- [ ] Archive migration preserves all data

### UX/Accessibility
- [ ] Dark mode support on all components
- [ ] Haptics on all interactive elements
- [ ] Accessibility labels on all pressables
- [ ] Empty states show helpful messages
- [ ] Loading states display during async operations

### Security
- [ ] No PII in console logs
- [ ] SQLite data encrypted
- [ ] File paths sanitized
- [ ] Input validation on search queries

### Testing
- [ ] Unit tests pass (Jest)
- [ ] Manual testing on iOS/Android/Web
- [ ] Demo mode works with 3 mock orders
- [ ] Offline mode functional

---

## 🚀 Quick Start Commands

```bash
# Type check
npx tsc --noEmit

# Run tests
npx jest

# Start dev server
npm start

# Test iOS simulator
npm run ios

# Test Android emulator
npm run android

# Test web
npm run web

# Build for production
npm run build
```

---

## 📞 Agent Handoff Protocol

When passing work between AI agents:

1. **Context file:** Agent A creates `AGENT_B_CONTEXT.md` with:
   - Completed tasks
   - Current state of codebase
   - Blocking issues (if any)
   - Next task to start

2. **Verification:** Agent B reads context + runs type check before starting

3. **Communication:** Use shared document (Google Doc) for async updates

---

**End of Implementation Plan**
**Author:** Claude Code (Sonnet 4.5)
**Date:** 2026-02-13
**Project:** My Compass — PCS Phase 5 (DORMANT)
