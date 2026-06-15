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
