import { describe, expect, it } from "vitest";
import {
  addDetailItem,
  addLargePlan,
  addPlanToDate,
  createInitialState,
  reorderDailyEntries,
  reorderDetailItems,
  removeDailyEntry,
  updateDailyEntryStatus,
  updateDetailItemStatus,
  removeLargePlan,
  updateLargePlanTitle
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

  it("removes a plan from one selected date without deleting the large plan", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addLargePlan(state, "Plan B", "2026-06-15T00:01:00.000Z");
    const keptLargePlanIds = state.largePlans.map((plan) => plan.id);
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:02:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[1].id, "2026-06-15T00:03:00.000Z");
    state = addPlanToDate(state, "2026-06-16", state.largePlans[0].id, "2026-06-15T00:04:00.000Z");
    const removedEntryId = state.dailyEntries["2026-06-15"][0].id;
    const keptEntryId = state.dailyEntries["2026-06-15"][1].id;

    state = removeDailyEntry(state, "2026-06-15", removedEntryId);

    expect(state.largePlans.map((plan) => plan.id)).toEqual(keptLargePlanIds);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.id)).toEqual([keptEntryId]);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.order)).toEqual([0]);
    expect(state.dailyEntries["2026-06-16"]).toHaveLength(1);
  });

  it("renames a large plan without changing its daily entries", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const planId = state.largePlans[0].id;

    state = updateLargePlanTitle(state, planId, "Plan B", "2026-06-15T00:02:00.000Z");

    expect(state.largePlans[0]).toMatchObject({
      id: planId,
      title: "Plan B",
      updatedAt: "2026-06-15T00:02:00.000Z"
    });
    expect(state.dailyEntries["2026-06-15"][0].largePlanId).toBe(planId);
  });

  it("removes a large plan and all date entries that reference it", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addLargePlan(state, "Plan B", "2026-06-15T00:01:00.000Z");
    const removedPlanId = state.largePlans[0].id;
    const keptPlanId = state.largePlans[1].id;
    state = addPlanToDate(state, "2026-06-15", removedPlanId, "2026-06-15T00:02:00.000Z");
    state = addPlanToDate(state, "2026-06-15", keptPlanId, "2026-06-15T00:03:00.000Z");
    state = addPlanToDate(state, "2026-06-16", removedPlanId, "2026-06-15T00:04:00.000Z");

    state = removeLargePlan(state, removedPlanId);

    expect(state.largePlans.map((plan) => plan.id)).toEqual([keptPlanId]);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.largePlanId)).toEqual([keptPlanId]);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.order)).toEqual([0]);
    expect(state.dailyEntries["2026-06-16"]).toEqual([]);
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
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.order)).toEqual([0, 1]);
  });

  it("moves the first large plan card over the second card", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addLargePlan(state, "Plan B", "2026-06-15T00:01:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:02:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[1].id, "2026-06-15T00:03:00.000Z");
    const firstId = state.dailyEntries["2026-06-15"][0].id;
    const secondId = state.dailyEntries["2026-06-15"][1].id;
    state = reorderDailyEntries(state, "2026-06-15", firstId, secondId);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.id)).toEqual([secondId, firstId]);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.order)).toEqual([0, 1]);
  });

  it("moves an earlier large plan card to a later card position", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addLargePlan(state, "Plan B", "2026-06-15T00:01:00.000Z");
    state = addLargePlan(state, "Plan C", "2026-06-15T00:02:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:03:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[1].id, "2026-06-15T00:04:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[2].id, "2026-06-15T00:05:00.000Z");
    const firstId = state.dailyEntries["2026-06-15"][0].id;
    const secondId = state.dailyEntries["2026-06-15"][1].id;
    const thirdId = state.dailyEntries["2026-06-15"][2].id;
    state = reorderDailyEntries(state, "2026-06-15", firstId, thirdId);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.id)).toEqual([secondId, thirdId, firstId]);
    expect(state.dailyEntries["2026-06-15"].map((entry) => entry.order)).toEqual([0, 1, 2]);
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

  it("moves the first detail item over the second item", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Detail A", "2026-06-15T00:02:00.000Z");
    state = addDetailItem(state, "2026-06-15", entryId, "Detail B", "2026-06-15T00:03:00.000Z");
    const [first, second] = state.dailyEntries["2026-06-15"][0].detailItems;
    state = reorderDetailItems(state, "2026-06-15", entryId, first.id, second.id);
    expect(state.dailyEntries["2026-06-15"][0].detailItems.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(state.dailyEntries["2026-06-15"][0].detailItems.map((item) => item.order)).toEqual([0, 1]);
  });

  it("moves an earlier detail item to a later item position", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Detail A", "2026-06-15T00:02:00.000Z");
    state = addDetailItem(state, "2026-06-15", entryId, "Detail B", "2026-06-15T00:03:00.000Z");
    state = addDetailItem(state, "2026-06-15", entryId, "Detail C", "2026-06-15T00:04:00.000Z");
    const [first, second, third] = state.dailyEntries["2026-06-15"][0].detailItems;
    state = reorderDetailItems(state, "2026-06-15", entryId, first.id, third.id);
    expect(state.dailyEntries["2026-06-15"][0].detailItems.map((item) => item.title)).toEqual([
      "Detail B",
      "Detail C",
      "Detail A"
    ]);
    expect(state.dailyEntries["2026-06-15"][0].detailItems.map((item) => item.order)).toEqual([0, 1, 2]);
    expect(state.dailyEntries["2026-06-15"][0].detailItems[2].id).toBe(first.id);
    expect(state.dailyEntries["2026-06-15"][0].detailItems[1].id).toBe(third.id);
    expect(state.dailyEntries["2026-06-15"][0].detailItems[0].id).toBe(second.id);
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

  it("returns the same state when reordering a missing date", () => {
    const state = createInitialState();
    const nextDailyState = reorderDailyEntries(state, "2026-06-16", "missing-active", "missing-over");
    const nextDetailState = reorderDetailItems(state, "2026-06-16", "missing-entry", "missing-active", "missing-over");
    expect(nextDailyState).toBe(state);
    expect(nextDetailState).toBe(state);
    expect(Object.keys(state.dailyEntries)).toEqual([]);
  });

  it("returns the same state when adding a detail item to a missing entry", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const nextState = addDetailItem(state, "2026-06-15", "missing-entry", "Detail A", "2026-06-15T00:02:00.000Z");
    expect(nextState).toBe(state);
    expect(state.dailyEntries["2026-06-15"][0].detailItems).toEqual([]);
  });

  it("returns the same state when updating a missing daily entry", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const nextState = updateDailyEntryStatus(
      state,
      "2026-06-15",
      "missing-entry",
      "done",
      "2026-06-15T00:02:00.000Z"
    );
    expect(nextState).toBe(state);
    expect(state.dailyEntries["2026-06-15"][0].status).toBe("waiting");
  });

  it("returns the same state when updating a missing detail item", () => {
    let state = createInitialState();
    state = addLargePlan(state, "Plan A", "2026-06-15T00:00:00.000Z");
    state = addPlanToDate(state, "2026-06-15", state.largePlans[0].id, "2026-06-15T00:01:00.000Z");
    const entryId = state.dailyEntries["2026-06-15"][0].id;
    state = addDetailItem(state, "2026-06-15", entryId, "Detail A", "2026-06-15T00:02:00.000Z");
    const originalUpdatedAt = state.dailyEntries["2026-06-15"][0].updatedAt;
    const nextState = updateDetailItemStatus(
      state,
      "2026-06-15",
      entryId,
      "missing-item",
      "done",
      "2026-06-15T00:03:00.000Z"
    );
    expect(nextState).toBe(state);
    expect(state.dailyEntries["2026-06-15"][0].updatedAt).toBe(originalUpdatedAt);
    expect(state.dailyEntries["2026-06-15"][0].detailItems[0].status).toBe("waiting");
  });
});
