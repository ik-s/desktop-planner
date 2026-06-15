import { useMemo, useState } from "react";
import { PlanDetailView } from "./components/PlanDetailView";
import { PlanLibraryPanel } from "./components/PlanLibraryPanel";
import { TodayPlannerView } from "./components/TodayPlannerView";
import { addDetailItem, addLargePlan, addPlanToDate, createInitialState } from "./model/plannerModel";
import type { PlannerState } from "./model/types";

const TODAY = "2026-06-15";

const createSampleState = (): PlannerState => {
  let state = createInitialState();
  state = addLargePlan(state, "Rust 공부", "2026-06-15T00:00:00.000Z");
  const rustPlan = state.largePlans[0];
  state = addPlanToDate(state, TODAY, rustPlan.id, "2026-06-15T00:01:00.000Z");
  const rustEntry = state.dailyEntries[TODAY][0];
  state = addDetailItem(state, TODAY, rustEntry.id, "Rust 1강", "2026-06-15T00:02:00.000Z");
  state = addDetailItem(state, TODAY, rustEntry.id, "Rust 2강", "2026-06-15T00:03:00.000Z");
  return state;
};

const nowIso = () => new Date().toISOString();

export default function App() {
  const [plannerState, setPlannerState] = useState<PlannerState>(() => createSampleState());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const todayEntries = plannerState.dailyEntries[TODAY] ?? [];
  const plansById = useMemo(
    () => new Map(plannerState.largePlans.map((plan) => [plan.id, plan])),
    [plannerState.largePlans]
  );
  const todayPlanIds = useMemo(() => new Set(todayEntries.map((entry) => entry.largePlanId)), [todayEntries]);
  const selectedEntry = selectedEntryId ? todayEntries.find((entry) => entry.id === selectedEntryId) : undefined;
  const selectedPlan = selectedEntry ? plansById.get(selectedEntry.largePlanId) : undefined;

  const handleCreatePlan = (title: string) => {
    setPlannerState((current) => addLargePlan(current, title, nowIso()));
  };

  const handleAddPlanToToday = (planId: string) => {
    setPlannerState((current) => addPlanToDate(current, TODAY, planId, nowIso()));
  };

  return (
    <main className="app-shell" aria-label="데스크톱 데일리 플래너">
      <div className="planner-layout">
        {selectedEntry && selectedPlan ? (
          <PlanDetailView date={TODAY} entry={selectedEntry} plan={selectedPlan} onBack={() => setSelectedEntryId(null)} />
        ) : (
          <TodayPlannerView
            date={TODAY}
            entries={todayEntries}
            plansById={plansById}
            onOpenEntry={setSelectedEntryId}
            onAddPlanToToday={handleAddPlanToToday}
          />
        )}

        <PlanLibraryPanel
          plans={plannerState.largePlans}
          todayPlanIds={todayPlanIds}
          onCreatePlan={handleCreatePlan}
          onAddPlanToToday={handleAddPlanToToday}
        />
      </div>
    </main>
  );
}
