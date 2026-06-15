import { createInitialState } from "../model/plannerModel";
import type { PlannerState } from "../model/types";

const VALID_STATUSES = new Set(["waiting", "in_progress", "done"]);

export type PlannerStorage = {
  loadState(): Promise<PlannerState>;
  saveState(state: PlannerState): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasStringFields = (value: Record<string, unknown>, fields: string[]) =>
  fields.every((field) => typeof value[field] === "string");

const hasValidStatus = (value: unknown) => typeof value === "string" && VALID_STATUSES.has(value);

const isValidDetailItem = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStringFields(value, ["id", "title", "createdAt", "updatedAt"]) &&
    typeof value.order === "number" &&
    hasValidStatus(value.status)
  );
};

const isValidDailyEntry = (value: unknown) => {
  if (!isRecord(value) || !Array.isArray(value.detailItems)) return false;
  return (
    hasStringFields(value, ["id", "date", "largePlanId", "createdAt", "updatedAt"]) &&
    typeof value.order === "number" &&
    hasValidStatus(value.status) &&
    value.detailItems.every(isValidDetailItem)
  );
};

const isValidLargePlan = (value: unknown) => {
  if (!isRecord(value)) return false;
  return hasStringFields(value, ["id", "title", "createdAt", "updatedAt"]);
};

const isPlannerState = (value: unknown): value is PlannerState => {
  if (!isRecord(value) || !Array.isArray(value.largePlans) || !isRecord(value.dailyEntries)) {
    return false;
  }

  return (
    value.largePlans.every(isValidLargePlan) &&
    Object.values(value.dailyEntries).every(
      (entries) => Array.isArray(entries) && entries.every(isValidDailyEntry)
    )
  );
};

const backUpAndResetState = (key: string, raw: string) => {
  localStorage.setItem(`${key}:backup`, raw);
  localStorage.removeItem(key);
  return createInitialState();
};

export const createLocalPlannerStorage = (key = "desktop-planner:v1"): PlannerStorage => ({
  async loadState() {
    const raw = localStorage.getItem(key);
    if (!raw) return createInitialState();

    try {
      const parsed = JSON.parse(raw);
      if (isPlannerState(parsed)) return parsed;
    } catch {
    }

    return backUpAndResetState(key, raw);
  },
  async saveState(state) {
    localStorage.setItem(key, JSON.stringify(state));
  }
});
