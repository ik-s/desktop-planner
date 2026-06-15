# Daily Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Korean-first daily planner where today's ordered list contains large plan cards, each opening to date-scoped detail items.

**Architecture:** Use a Vite React TypeScript app. Keep planner mutations in pure model functions, persist through a storage adapter, and keep React views focused on rendering, view state, and drag interactions.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, dnd-kit, lucide-react, localStorage, Pretendard.

---

## File Structure

- Create `package.json`: scripts, runtime dependencies, dev dependencies.
- Create `index.html`: root document and Pretendard font import.
- Create `vite.config.ts`: Vite + React + Vitest jsdom config.
- Create `tsconfig.json`: strict TypeScript config.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`: app state, view switching, storage hydration.
- Create `src/styles.css`: Discord-inspired planner theme using Pretendard.
- Create `src/model/types.ts`: planner state and entity types.
- Create `src/model/plannerModel.ts`: pure add, reorder, update, and status functions.
- Create `src/model/plannerModel.test.ts`: unit tests for planner mutations.
- Create `src/storage/plannerStorage.ts`: storage interface and localStorage adapter.
- Create `src/storage/plannerStorage.test.ts`: persistence tests with jsdom localStorage.
- Create `src/components/TodayPlannerView.tsx`: selected date's large plan cards.
- Create `src/components/LargePlanCard.tsx`: one top-level daily card with detail previews.
- Create `src/components/PlanDetailView.tsx`: detail list for one large plan on one date.
- Create `src/components/DetailItemRow.tsx`: one detail item row.
- Create `src/components/PlanLibraryPanel.tsx`: create/select large plan titles.
- Create `src/components/StatusBadge.tsx`: Korean status badge.
- Create `src/components/EmptyState.tsx`: reusable Korean empty state.

## Task 1: Scaffold Vite React TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "desktop-planner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@vitejs/plugin-react": "^5.1.1",
    "lucide-react": "^0.468.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "jsdom": "^27.3.0",
    "typescript": "^5.9.3",
    "vite": "^7.2.7",
    "vitest": "^4.0.15"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" />
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
    <title>Desktop Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: []
  }
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

- [ ] **Step 5: Create minimal React entry files**

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>데스크톱 플래너</h1>
      <p>오늘 할 일을 큰 계획 단위로 정리합니다.</p>
    </main>
  );
}
```

`src/styles.css`:

```css
:root {
  font-family: Pretendard, Inter, system-ui, sans-serif;
  color: #ffffff;
  background: #0a0d3a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #0a0d3a;
}

button,
input {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 7: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold planner app"
```

## Task 2: Add Planner Model Types and Pure Mutations

**Files:**
- Create: `src/model/types.ts`
- Create: `src/model/plannerModel.ts`
- Create: `src/model/plannerModel.test.ts`

- [ ] **Step 1: Write failing model tests**

```ts
import { describe, expect, it } from "vitest";
import {
  addDetailItem,
  addLargePlan,
  addPlanToDate,
  createInitialState,
  reorderDailyEntries,
  reorderDetailItems,
  updateDailyEntryStatus,
  updateDetailItemStatus
} from "./plannerModel";

describe("plannerModel", () => {
  it("creates a large plan title", () => {
    const state = addLargePlan(createInitialState(), "Rust 공부", "2026-06-15T00:00:00.000Z");
    expect(state.largePlans).toHaveLength(1);
    expect(state.largePlans[0].title).toBe("Rust 공부");
  });

  it("adds a large plan to a selected date", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    expect(state.dailyEntries["2026-06-15"][0].largePlanId).toBe(state.largePlans[0].id);
    expect(state.dailyEntries["2026-06-15"][0].order).toBe(0);
  });

  it("adds date-scoped detail items inside a daily plan entry", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Rust 1강", "2026-06-15T00:02:00.000Z");
    expect(state.dailyEntries["2026-06-15"][0].detailItems[0].title).toBe("Rust 1강");
  });

  it("reorders today's large plan cards", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
    state = addLargePlan(state, "운동", "2026-06-15T00:01:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:02:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[1].id, "2026-06-15T00:03:00.000Z");
    const firstId = state.dailyEntries["2026-06-15"][0].id;
    const secondId = state.dailyEntries["2026-06-15"][1].id;
    state = reorderDailyEntries(state, "2026-06-15", secondId, firstId);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.id)).toEqual([secondId, firstId]);
  });

  it("reorders detail items inside one plan", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Rust 1강", "2026-06-15T00:02:00.000Z");
    state = addDetailItem(state, "2026-06-15", entryId, "Rust 2강", "2026-06-15T00:03:00.000Z");
    const [first, second] = state.dailyEntries["2026-06-15"][0].detailItems;
    state = reorderDetailItems(state, "2026-06-15", entryId, second.id, first.id);
    expect(state.dailyEntries["2026-06-15"][0].detailItems.map((item) => item.title)).toEqual(["Rust 2강", "Rust 1강"]);
  });

  it("updates statuses", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Rust 1강", "2026-06-15T00:02:00.000Z");
    const itemId = state.dailyEntries["2026-06-15"][0].detailItems[0].id;
    state = updateDailyEntryStatus(state, "2026-06-15", entryId, "in_progress", "2026-06-15T00:03:00.000Z");
    state = updateDetailItemStatus(state, "2026-06-15", entryId, itemId, "done", "2026-06-15T00:04:00.000Z");
    expect(state.dailyEntries["2026-06-15"][0].status).toBe("in_progress");
    expect(state.dailyEntries["2026-06-15"][0].detailItems[0].status).toBe("done");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/model/plannerModel.test.ts`

Expected: FAIL because `src/model/plannerModel.ts` does not exist.

- [ ] **Step 3: Add model types**

```ts
export type PlannerStatus = "waiting" | "in_progress" | "done";

export type LargePlan = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DetailItem = {
  id: string;
  title: string;
  order: number;
  status: PlannerStatus;
  createdAt: string;
  updatedAt: string;
};

export type DailyPlanEntry = {
  id: string;
  date: string;
  largePlanId: string;
  order: number;
  status: PlannerStatus;
  detailItems: DetailItem[];
  createdAt: string;
  updatedAt: string;
};

export type PlannerState = {
  largePlans: LargePlan[];
  dailyEntries: Record<string, DailyPlanEntry[]>;
};
```

- [ ] **Step 4: Add pure model implementation**

```ts
import type { DailyPlanEntry, DetailItem, LargePlan, PlannerState, PlannerStatus } from "./types";

const makeId = (prefix: string, seed: string) => `${prefix}-${seed.replace(/[^a-zA-Z0-9]/g, "-")}`;

const normalizeOrders = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, index) => ({ ...item, order: index }));

const moveBefore = <T extends { id: string; order: number }>(items: T[], activeId: string, overId: string): T[] => {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return items;
  const next = [...items];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return normalizeOrders(next);
};

export const createInitialState = (): PlannerState => ({
  largePlans: [],
  dailyEntries: {}
});

export const addLargePlan = (state: PlannerState, title: string, now: string): PlannerState => {
  const trimmed = title.trim();
  if (!trimmed) return state;
  const plan: LargePlan = {
    id: makeId("plan", `${trimmed}-${now}`),
    title: trimmed,
    createdAt: now,
    updatedAt: now
  };
  return { ...state, largePlans: [...state.largePlans, plan] };
};

export const addPlanToDate = (state: PlannerState, date: string, largePlanId: string, now: string): PlannerState => {
  if (!state.largePlans.some((plan) => plan.id === largePlanId)) return state;
  const entries = state.dailyEntries[date] ?? [];
  if (entries.some((entry) => entry.largePlanId === largePlanId)) return state;
  const entry: DailyPlanEntry = {
    id: makeId("entry", `${date}-${largePlanId}`),
    date,
    largePlanId,
    order: entries.length,
    status: "waiting",
    detailItems: [],
    createdAt: now,
    updatedAt: now
  };
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: [...entries, entry] } };
};

export const addDetailItem = (state: PlannerState, date: string, entryId: string, title: string, now: string): PlannerState => {
  const trimmed = title.trim();
  if (!trimmed) return state;
  const entries = state.dailyEntries[date] ?? [];
  const nextEntries = entries.map((entry) => {
    if (entry.id !== entryId) return entry;
    const item: DetailItem = {
      id: makeId("detail", `${entryId}-${trimmed}-${now}`),
      title: trimmed,
      order: entry.detailItems.length,
      status: "waiting",
      createdAt: now,
      updatedAt: now
    };
    return { ...entry, detailItems: [...entry.detailItems, item], updatedAt: now };
  });
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: nextEntries } };
};

export const reorderDailyEntries = (state: PlannerState, date: string, activeId: string, overId: string): PlannerState => {
  const entries = state.dailyEntries[date] ?? [];
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: moveBefore(entries, activeId, overId) } };
};

export const reorderDetailItems = (state: PlannerState, date: string, entryId: string, activeId: string, overId: string): PlannerState => {
  const entries = state.dailyEntries[date] ?? [];
  const nextEntries = entries.map((entry) =>
    entry.id === entryId ? { ...entry, detailItems: moveBefore(entry.detailItems, activeId, overId) } : entry
  );
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: nextEntries } };
};

export const updateDailyEntryStatus = (
  state: PlannerState,
  date: string,
  entryId: string,
  status: PlannerStatus,
  now: string
): PlannerState => ({
  ...state,
  dailyEntries: {
    ...state.dailyEntries,
    [date]: (state.dailyEntries[date] ?? []).map((entry) =>
      entry.id === entryId ? { ...entry, status, updatedAt: now } : entry
    )
  }
});

export const updateDetailItemStatus = (
  state: PlannerState,
  date: string,
  entryId: string,
  itemId: string,
  status: PlannerStatus,
  now: string
): PlannerState => ({
  ...state,
  dailyEntries: {
    ...state.dailyEntries,
    [date]: (state.dailyEntries[date] ?? []).map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            updatedAt: now,
            detailItems: entry.detailItems.map((item) => (item.id === itemId ? { ...item, status, updatedAt: now } : item))
          }
        : entry
    )
  }
});
```

- [ ] **Step 5: Run model tests**

Run: `npm test -- src/model/plannerModel.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/model/types.ts src/model/plannerModel.ts src/model/plannerModel.test.ts
git commit -m "feat: add planner model"
```

## Task 3: Add Local Storage Adapter

**Files:**
- Create: `src/storage/plannerStorage.ts`
- Create: `src/storage/plannerStorage.test.ts`

- [ ] **Step 1: Write failing storage tests**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState } from "../model/plannerModel";
import { createLocalPlannerStorage } from "./plannerStorage";

describe("plannerStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns initial state when storage is empty", async () => {
    const storage = createLocalPlannerStorage("planner-test");
    await expect(storage.loadState()).resolves.toEqual(createInitialState());
  });

  it("saves and loads planner state", async () => {
    const storage = createLocalPlannerStorage("planner-test");
    const state = { largePlans: [{ id: "plan-1", title: "Rust 공부", createdAt: "now", updatedAt: "now" }], dailyEntries: {} };
    await storage.saveState(state);
    await expect(storage.loadState()).resolves.toEqual(state);
  });

  it("backs up invalid JSON and returns initial state", async () => {
    localStorage.setItem("planner-test", "{broken");
    const storage = createLocalPlannerStorage("planner-test");
    await expect(storage.loadState()).resolves.toEqual(createInitialState());
    expect(localStorage.getItem("planner-test:backup")).toBe("{broken");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/storage/plannerStorage.test.ts`

Expected: FAIL because `plannerStorage.ts` does not exist.

- [ ] **Step 3: Add storage adapter**

```ts
import { createInitialState } from "../model/plannerModel";
import type { PlannerState } from "../model/types";

export type PlannerStorage = {
  loadState(): Promise<PlannerState>;
  saveState(state: PlannerState): Promise<void>;
};

export const createLocalPlannerStorage = (key = "desktop-planner:v1"): PlannerStorage => ({
  async loadState() {
    const raw = localStorage.getItem(key);
    if (!raw) return createInitialState();
    try {
      return JSON.parse(raw) as PlannerState;
    } catch {
      localStorage.setItem(`${key}:backup`, raw);
      localStorage.removeItem(key);
      return createInitialState();
    }
  },
  async saveState(state) {
    localStorage.setItem(key, JSON.stringify(state));
  }
});
```

- [ ] **Step 4: Run storage tests**

Run: `npm test -- src/storage/plannerStorage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/plannerStorage.ts src/storage/plannerStorage.test.ts
git commit -m "feat: add planner storage"
```

## Task 4: Build Static Planner UI Components

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/LargePlanCard.tsx`
- Create: `src/components/DetailItemRow.tsx`
- Create: `src/components/TodayPlannerView.tsx`
- Create: `src/components/PlanDetailView.tsx`
- Create: `src/components/PlanLibraryPanel.tsx`

- [ ] **Step 1: Add component contracts**

Use props that pass data and callbacks down from `App`, keeping mutation logic out of components:

```ts
type TodayPlannerViewProps = {
  date: string;
  entries: DailyPlanEntry[];
  plansById: Map<string, LargePlan>;
  onOpenEntry(entryId: string): void;
  onAddPlanToToday(planId: string): void;
};
```

- [ ] **Step 2: Implement `StatusBadge.tsx`**

```tsx
import type { PlannerStatus } from "../model/types";

const labels: Record<PlannerStatus, string> = {
  waiting: "대기",
  in_progress: "진행중",
  done: "완료"
};

export function StatusBadge({ status }: { status: PlannerStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>;
}
```

- [ ] **Step 3: Implement `EmptyState.tsx`**

```tsx
export function EmptyState({ title, action }: { title: string; action?: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {action ? <span>{action}</span> : null}
    </div>
  );
}
```

- [ ] **Step 4: Implement card and row renderers**

`LargePlanCard.tsx` must render large plan title and up to two detail chips:

```tsx
import { GripVertical } from "lucide-react";
import type { DailyPlanEntry, LargePlan } from "../model/types";
import { StatusBadge } from "./StatusBadge";

export function LargePlanCard({ entry, plan, onOpen }: { entry: DailyPlanEntry; plan: LargePlan; onOpen(): void }) {
  const previewItems = entry.detailItems.slice(0, 2);
  const hiddenCount = Math.max(entry.detailItems.length - previewItems.length, 0);
  return (
    <button className="large-plan-card" type="button" onClick={onOpen}>
      <GripVertical className="drag-icon" size={20} aria-hidden />
      <div className="large-plan-card__content">
        <strong>{plan.title}</strong>
        <div className="detail-preview">
          {previewItems.map((item) => (
            <span key={item.id}>{item.title}</span>
          ))}
          {hiddenCount > 0 ? <span>+{hiddenCount}</span> : null}
        </div>
      </div>
      <StatusBadge status={entry.status} />
    </button>
  );
}
```

`DetailItemRow.tsx` must render detail title and status:

```tsx
import { GripVertical } from "lucide-react";
import type { DetailItem } from "../model/types";
import { StatusBadge } from "./StatusBadge";

export function DetailItemRow({ item }: { item: DetailItem }) {
  return (
    <div className="detail-row">
      <GripVertical className="drag-icon" size={20} aria-hidden />
      <strong>{item.title}</strong>
      <StatusBadge status={item.status} />
    </div>
  );
}
```

- [ ] **Step 5: Implement views without drag behavior**

`TodayPlannerView.tsx` renders cards and empty state. `PlanDetailView.tsx` renders detail rows and back button. `PlanLibraryPanel.tsx` renders plan creation and add-to-today actions.

- [ ] **Step 6: Add Discord-inspired CSS**

Required selectors in `src/styles.css`:

```css
.planner-layout,
.planner-panel,
.large-plan-card,
.detail-row,
.status-badge,
.detail-preview,
.empty-state {
  border-radius: 16px;
}
```

Use `#0a0d3a`, `#1e2353`, `#23272a`, `#5865f2`, `#35ed7e`, `#ec48bd`, and white text. Keep all typography on Pretendard.

- [ ] **Step 7: Wire static sample state in `App.tsx`**

Use `createInitialState`, `addLargePlan`, `addPlanToDate`, and `addDetailItem` to create a temporary in-memory sample with `Rust 공부`, `Rust 1강`, and `Rust 2강`.

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/styles.css src/components
git commit -m "feat: add planner UI components"
```

## Task 5: Wire Real App State and Persistence

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace sample state with storage-backed state**

`App.tsx` must:

- Load state from `createLocalPlannerStorage()` on mount.
- Save state whenever loaded state changes.
- Use today's date in `YYYY-MM-DD` format.
- Track selected daily entry id; `null` means today planner view.
- Expose handlers for creating large plans, adding them to today, adding detail items, status changes, and back navigation.

- [ ] **Step 2: Add helper functions in `App.tsx`**

```ts
const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getPlansById = (plans: LargePlan[]) => new Map(plans.map((plan) => [plan.id, plan]));
```

- [ ] **Step 3: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist planner state"
```

## Task 6: Add Drag-and-Drop Ordering

**Files:**
- Modify: `src/components/TodayPlannerView.tsx`
- Modify: `src/components/PlanDetailView.tsx`
- Modify: `src/components/LargePlanCard.tsx`
- Modify: `src/components/DetailItemRow.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add reorder callbacks**

`TodayPlannerViewProps` gets:

```ts
onReorderDailyEntries(activeId: string, overId: string): void;
```

`PlanDetailViewProps` gets:

```ts
onReorderDetailItems(activeId: string, overId: string): void;
```

- [ ] **Step 2: Wrap lists with dnd-kit**

Use `DndContext`, `SortableContext`, `verticalListSortingStrategy`, and `useSortable`. On drag end, call the relevant reorder callback only when `event.over?.id` exists and differs from `event.active.id`.

- [ ] **Step 3: Move sortable wiring into card and row components**

Each sortable component must apply:

```tsx
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
const style = { transform: CSS.Transform.toString(transform), transition };
```

Apply `attributes` and `listeners` to the drag handle button, not the whole card, so clicking the card still opens the detail screen.

- [ ] **Step 4: Run model tests**

Run: `npm test -- src/model/plannerModel.test.ts`

Expected: PASS.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components src/styles.css
git commit -m "feat: add drag ordering"
```

## Task 7: Final Browser Verification

**Files:**
- No required code changes unless verification exposes defects.

- [ ] **Step 1: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a localhost URL.

- [ ] **Step 2: Manual flow**

Open the local URL and verify:

- Create `Rust 공부`.
- Add `Rust 공부` to today's planner.
- Click `Rust 공부`.
- Add `Rust 1강`.
- Add `Rust 2강`.
- Return to today's planner.
- Confirm the `Rust 공부` card shows `Rust 1강` and `Rust 2강` as small preview chips.
- Drag the `Rust 공부` card relative to another large plan card.
- Open `Rust 공부` and drag `Rust 2강` before `Rust 1강`.
- Refresh and confirm data persists.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit verification fixes if needed**

```bash
git add src
git commit -m "fix: polish planner verification"
```

Skip this commit if no fixes were needed.

## Self-Review

- Spec coverage: The plan covers large plan title library, date-scoped daily plan entries, detail item preview chips, click-through detail screen, top-level drag ordering, detail drag ordering, local storage adapter, Korean UI, Pretendard, and Discord-inspired visual system from `DESIGN.md`.
- Placeholder scan: No unfinished-marker text or open-ended implementation placeholders are intentionally present.
- Type consistency: Plan uses `LargePlan`, `DailyPlanEntry`, `DetailItem`, `PlannerState`, and `PlannerStatus` consistently across model, storage, and component tasks.
