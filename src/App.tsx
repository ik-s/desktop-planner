import { useEffect, useMemo, useState } from "react";
import { PlanDetailView } from "./components/PlanDetailView";
import { PlanLibraryPanel } from "./components/PlanLibraryPanel";
import { TodayPlannerView } from "./components/TodayPlannerView";
import {
  addDetailItem,
  addLargePlan,
  addPlanToDate,
  createInitialState,
  updateDailyEntryStatus,
  updateDetailItemStatus
} from "./model/plannerModel";
import type { LargePlan, PlannerState, PlannerStatus } from "./model/types";
import { createLocalPlannerStorage } from "./storage/plannerStorage";

const storage = createLocalPlannerStorage();

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => formatDateKey(new Date());

const getPlansById = (plans: LargePlan[]) => new Map(plans.map((plan) => [plan.id, plan]));

const nowIso = () => new Date().toISOString();

export default function App() {
  const [plannerState, setPlannerState] = useState<PlannerState>(() => createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    let isActive = true;

    storage.loadState().then((loadedState) => {
      if (!isActive) return;
      setPlannerState(loadedState);
      setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void storage.saveState(plannerState);
  }, [isLoaded, plannerState]);

  const todayEntries = plannerState.dailyEntries[todayKey] ?? [];
  const plansById = useMemo(() => getPlansById(plannerState.largePlans), [plannerState.largePlans]);
  const todayPlanIds = useMemo(() => new Set(todayEntries.map((entry) => entry.largePlanId)), [todayEntries]);
  const selectedEntry = selectedEntryId ? todayEntries.find((entry) => entry.id === selectedEntryId) : undefined;
  const selectedPlan = selectedEntry ? plansById.get(selectedEntry.largePlanId) : undefined;

  useEffect(() => {
    if (selectedEntryId && !todayEntries.some((entry) => entry.id === selectedEntryId)) {
      setSelectedEntryId(null);
    }
  }, [selectedEntryId, todayEntries]);

  const handleCreatePlan = (title: string) => {
    setPlannerState((current) => addLargePlan(current, title, nowIso()));
  };

  const handleAddPlanToToday = (planId: string) => {
    setPlannerState((current) => addPlanToDate(current, todayKey, planId, nowIso()));
  };

  const handleAddDetailItem = (entryId: string, title: string) => {
    setPlannerState((current) => addDetailItem(current, todayKey, entryId, title, nowIso()));
  };

  const handleDailyEntryStatusChange = (entryId: string, status: PlannerStatus) => {
    setPlannerState((current) => updateDailyEntryStatus(current, todayKey, entryId, status, nowIso()));
  };

  const handleDetailItemStatusChange = (entryId: string, itemId: string, status: PlannerStatus) => {
    setPlannerState((current) => updateDetailItemStatus(current, todayKey, entryId, itemId, status, nowIso()));
  };

  return (
    <main className="app-shell" aria-label="데스크톱 데일리 플래너">
      <div className="planner-layout">
        {selectedEntry && selectedPlan ? (
          <PlanDetailView
            date={todayKey}
            entry={selectedEntry}
            plan={selectedPlan}
            onBack={() => setSelectedEntryId(null)}
            onAddDetailItem={handleAddDetailItem}
            onEntryStatusChange={handleDailyEntryStatusChange}
            onDetailItemStatusChange={handleDetailItemStatusChange}
          />
        ) : (
          <TodayPlannerView
            date={todayKey}
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
