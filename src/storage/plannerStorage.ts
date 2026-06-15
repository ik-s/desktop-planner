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
