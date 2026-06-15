# Daily Planner Design

Date: 2026-06-15
Status: Approved for implementation planning

## Goal

Build a Korean-first daily planner that opens as a local web app first and can later be wrapped as a desktop app. The planner is centered on deciding today's work order.

The app uses "large plans" as title-only buckets. A user can create a large plan such as `Rust 공부`, add that plan to today's planner, then enter the plan detail screen to add smaller items such as `Rust 1강`, `Rust 2강`, or `소유권 예제 따라치기`.

## Confirmed Requirements

- The default workflow is a day-based planner, not a general project management board.
- Large plans are title-only items, such as `Rust 공부`.
- Today's planner shows large plan cards, not every small detail item as a top-level row.
- A large plan card shows a compact preview of its detail items below the title.
- Clicking a large plan card opens that plan's detail list for the selected date.
- Detail items can be added inside the plan detail list.
- The user can reorder today's large plan cards with drag and drop.
- Detail items inside a large plan can also be reordered with drag and drop.
- Daily planner records are saved by date, so past days can be viewed later.
- The first implementation is a React/Vite local web app.
- Storage starts locally in the browser, but access is isolated behind a storage module so a later Tauri/Electron desktop wrapper can replace it.
- UI copy is Korean.
- Visual direction follows `DESIGN.md`, inspired by Discord.
- Typography uses Pretendard.

## Product Model

The app has two core levels:

1. Large plan library
   - Global title list.
   - Example: `Rust 공부`, `운동`, `개인 프로젝트`.
   - A large plan has no required description in the MVP.

2. Daily plan entries
   - Date-scoped instances of large plans.
   - Example on 2026-06-15: `Rust 공부` appears as one card in today's ordered list.
   - Each daily plan entry owns its own detail items for that date.

This means `Rust 공부` can exist in the global plan library, while `Rust 1강` and `Rust 2강` are written as today's detail items inside the `Rust 공부` daily entry.

## Main User Flow

1. User opens the app.
2. App shows today's planner.
3. User creates or selects a large plan, such as `Rust 공부`.
4. User adds that large plan to today's planner.
5. Today's planner displays `Rust 공부` as a top-level card.
6. User clicks the `Rust 공부` card.
7. App opens the `Rust 공부` detail screen for the selected date.
8. User adds detail items such as `Rust 1강`, `Rust 2강`.
9. User reorders details as needed.
10. User returns to today's planner and reorders large plan cards as needed.

## Screens

### Today Planner

Purpose: decide the order of today's large work blocks.

Content:

- Current date.
- Button to add a large plan to today.
- Ordered list of large plan cards.
- Each card shows:
  - Drag handle.
  - Large plan title.
  - Small detail preview chips, for example `Rust 1강`, `Rust 2강`, `+2`.
  - Status badge such as `대기`, `진행중`, or `완료`.

Interactions:

- Drag cards to reorder the day.
- Click a card to open its detail screen.
- Add a large plan to today from the large plan library.
- Mark a whole large plan entry as waiting, in progress, or complete.

### Plan Detail Screen

Purpose: manage the concrete steps for one large plan on one date.

Content:

- Back navigation to the daily planner.
- Selected large plan title.
- Button to add a detail item.
- Ordered list of detail items.
- Each detail item shows:
  - Drag handle.
  - Detail title.
  - Status badge.

Interactions:

- Add detail items.
- Drag detail items to reorder them.
- Change a detail item's status.
- Return to today's planner.

## Data Shape

```ts
type LargePlan = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type DailyPlanEntry = {
  id: string;
  date: string;
  largePlanId: string;
  order: number;
  status: "waiting" | "in_progress" | "done";
  detailItems: DetailItem[];
  createdAt: string;
  updatedAt: string;
};

type DetailItem = {
  id: string;
  title: string;
  order: number;
  status: "waiting" | "in_progress" | "done";
  createdAt: string;
  updatedAt: string;
};
```

`DailyPlanEntry.detailItems` are date-scoped. This avoids turning the MVP into a full curriculum/project tracker.

## Storage Design

Use a small storage adapter from the start:

```ts
type PlannerStorage = {
  loadState(): Promise<PlannerState>;
  saveState(state: PlannerState): Promise<void>;
};
```

The first adapter persists JSON in `localStorage`. Components and planner logic should not call `localStorage` directly.

This keeps the MVP simple while leaving a clear path to a desktop storage backend later.

## Component Boundaries

- `App`: top-level route/view state and app shell.
- `TodayPlannerView`: selected date, daily card ordering, add-large-plan entry point.
- `LargePlanCard`: one top-level card in the daily list.
- `PlanDetailView`: detail list for one large plan on one date.
- `DetailItemRow`: one reorderable detail item.
- `PlanLibraryPanel`: create and select large plan titles.
- `storage`: local persistence adapter.
- `plannerModel`: pure functions for add, update, reorder, and status changes.

Planner mutations should live in pure functions where possible so they can be tested without rendering the UI.

## Visual Design

Use `DESIGN.md` as the project UI reference with these product-specific adjustments:

- Keep Discord-inspired colors: deep indigo canvas, Blurple primary actions, electric green high-intent/action state, magenta only as a restrained accent.
- Use Pretendard for all text.
- Use rounded panels and cards.
- Keep the interface denser and calmer than a marketing page because the app is a repeated-use productivity tool.
- Avoid decorative visuals that compete with the planner content.
- Make drag handles and status badges easy to scan.

## Error Handling

MVP handling:

- Empty state when no large plan is added to today.
- Empty state when a selected large plan has no detail items yet.
- Prevent saving blank titles.
- If stored JSON cannot be parsed, fall back to a fresh empty state and preserve the broken payload under a backup key before overwriting.

## Testing

Unit tests:

- Add large plan.
- Add large plan to a date.
- Add detail item to a daily plan entry.
- Reorder daily plan entries.
- Reorder detail items.
- Persist and restore planner state through the storage adapter.

Manual browser checks:

- Create `Rust 공부`.
- Add `Rust 공부` to today.
- Open `Rust 공부`.
- Add `Rust 1강` and `Rust 2강`.
- Return to today and confirm the card preview shows detail chips.
- Reorder the top-level daily cards.
- Reorder detail items.
- Refresh browser and confirm data remains.

## Out of Scope for MVP

- Cloud sync.
- Login/accounts.
- Notifications.
- Recurring tasks.
- Calendar integration.
- Cross-device data sharing.
- Rich text descriptions for large plans.
- Statistics dashboards.

