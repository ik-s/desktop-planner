import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState } from "../model/plannerModel";
import type { PlannerState } from "../model/types";
import { createLocalPlannerStorage } from "./plannerStorage";

describe("plannerStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns initial state when storage is empty", async () => {
    const storage = createLocalPlannerStorage("planner-test");
    await expect(storage.loadState()).resolves.toEqual(createInitialState());
  });

  it("loads a valid current planner state", async () => {
    const storage = createLocalPlannerStorage("planner-test");
    const state: PlannerState = {
      largePlans: [{ id: "plan-1", title: "Rust study", createdAt: "now", updatedAt: "now" }],
      dailyEntries: {
        "2026-06-15": [
          {
            id: "entry-1",
            date: "2026-06-15",
            largePlanId: "plan-1",
            status: "in_progress",
            order: 1,
            createdAt: "now",
            updatedAt: "now",
            detailItems: [
              {
                id: "detail-1",
                title: "Sketch UI",
                status: "waiting",
                order: 1,
                createdAt: "now",
                updatedAt: "now"
              }
            ]
          }
        ]
      }
    };
    await storage.saveState(state);
    await expect(storage.loadState()).resolves.toEqual(state);
  });

  it("backs up valid JSON with invalid shape and returns initial state", async () => {
    const raw = JSON.stringify({ largePlans: [{ id: "plan-1" }], dailyEntries: [] });
    localStorage.setItem("planner-test", raw);
    const storage = createLocalPlannerStorage("planner-test");

    await expect(storage.loadState()).resolves.toEqual(createInitialState());
    expect(localStorage.getItem("planner-test:backup")).toBe(raw);
    expect(localStorage.getItem("planner-test")).toBeNull();
  });

  it("backs up invalid JSON and returns initial state", async () => {
    localStorage.setItem("planner-test", "{broken");
    const storage = createLocalPlannerStorage("planner-test");
    await expect(storage.loadState()).resolves.toEqual(createInitialState());
    expect(localStorage.getItem("planner-test:backup")).toBe("{broken");
    expect(localStorage.getItem("planner-test")).toBeNull();
  });
});
