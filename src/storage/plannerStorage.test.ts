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
