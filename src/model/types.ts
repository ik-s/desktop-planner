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
