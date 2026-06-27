import type { DailyPlanEntry, DetailItem, LargePlan, PlannerState, PlannerStatus } from "./types";

const makeId = (prefix: string, seed: string) => `${prefix}-${seed.replace(/[^a-zA-Z0-9]/g, "-")}`;

const normalizeOrders = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, index) => ({ ...item, order: index }));

const moveToIndex = <T extends { id: string; order: number }>(items: T[], activeId: string, overId: string): T[] => {
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

export const updateLargePlanTitle = (
  state: PlannerState,
  largePlanId: string,
  title: string,
  now: string
): PlannerState => {
  const trimmed = title.trim();
  if (!trimmed || !state.largePlans.some((plan) => plan.id === largePlanId)) return state;
  return {
    ...state,
    largePlans: state.largePlans.map((plan) =>
      plan.id === largePlanId ? { ...plan, title: trimmed, updatedAt: now } : plan
    )
  };
};

export const removeLargePlan = (state: PlannerState, largePlanId: string): PlannerState => {
  if (!state.largePlans.some((plan) => plan.id === largePlanId)) return state;
  return {
    largePlans: state.largePlans.filter((plan) => plan.id !== largePlanId),
    dailyEntries: Object.fromEntries(
      Object.entries(state.dailyEntries).map(([date, entries]) => [
        date,
        normalizeOrders(entries.filter((entry) => entry.largePlanId !== largePlanId))
      ])
    )
  };
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

export const removeDailyEntry = (state: PlannerState, date: string, entryId: string): PlannerState => {
  const entries = state.dailyEntries[date];
  if (!entries || !entries.some((entry) => entry.id === entryId)) return state;
  return {
    ...state,
    dailyEntries: {
      ...state.dailyEntries,
      [date]: normalizeOrders(entries.filter((entry) => entry.id !== entryId))
    }
  };
};

export const addDetailItem = (
  state: PlannerState,
  date: string,
  entryId: string,
  title: string,
  now: string
): PlannerState => {
  const trimmed = title.trim();
  if (!trimmed) return state;
  const entries = state.dailyEntries[date];
  if (!entries) return state;
  if (!entries.some((entry) => entry.id === entryId)) return state;
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
  const entries = state.dailyEntries[date];
  if (!entries) return state;
  const nextEntries = moveToIndex(entries, activeId, overId);
  if (nextEntries === entries) return state;
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: nextEntries } };
};

export const reorderDetailItems = (
  state: PlannerState,
  date: string,
  entryId: string,
  activeId: string,
  overId: string
): PlannerState => {
  const entries = state.dailyEntries[date];
  if (!entries) return state;
  const targetEntry = entries.find((entry) => entry.id === entryId);
  if (!targetEntry) return state;
  const nextDetailItems = moveToIndex(targetEntry.detailItems, activeId, overId);
  if (nextDetailItems === targetEntry.detailItems) return state;
  const nextEntries = entries.map((entry) => (entry.id === entryId ? { ...entry, detailItems: nextDetailItems } : entry));
  return { ...state, dailyEntries: { ...state.dailyEntries, [date]: nextEntries } };
};

export const updateDailyEntryStatus = (
  state: PlannerState,
  date: string,
  entryId: string,
  status: PlannerStatus,
  now: string
): PlannerState => {
  const entries = state.dailyEntries[date];
  if (!entries) return state;
  if (!entries.some((entry) => entry.id === entryId)) return state;
  return {
    ...state,
    dailyEntries: {
      ...state.dailyEntries,
      [date]: entries.map((entry) => (entry.id === entryId ? { ...entry, status, updatedAt: now } : entry))
    }
  };
};

export const updateDetailItemStatus = (
  state: PlannerState,
  date: string,
  entryId: string,
  itemId: string,
  status: PlannerStatus,
  now: string
): PlannerState => {
  const entries = state.dailyEntries[date];
  if (!entries) return state;
  const targetEntry = entries.find((entry) => entry.id === entryId);
  if (!targetEntry) return state;
  if (!targetEntry.detailItems.some((item) => item.id === itemId)) return state;
  return {
    ...state,
    dailyEntries: {
      ...state.dailyEntries,
      [date]: entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              updatedAt: now,
              detailItems: entry.detailItems.map((item) =>
                item.id === itemId ? { ...item, status, updatedAt: now } : item
              )
            }
          : entry
      )
    }
  };
};
