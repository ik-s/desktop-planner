import { useEffect, useMemo, useState } from "react";
import { PlanDetailView } from "./components/PlanDetailView";
import { PlanLibraryPanel } from "./components/PlanLibraryPanel";
import { TodayPlannerView } from "./components/TodayPlannerView";
import {
  addDetailItem,
  addLargePlan,
  addPlanToDate,
  createInitialState,
  reorderDailyEntries,
  reorderDetailItems,
  updateDailyEntryStatus,
  updateDetailItemStatus
} from "./model/plannerModel";
import type { LargePlan, PlannerState, PlannerStatus } from "./model/types";
import { createLocalPlannerStorage, type PlannerStorage } from "./storage/plannerStorage";

const defaultStorage = createLocalPlannerStorage();

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => formatDateKey(new Date());

const getPlansById = (plans: LargePlan[]) => new Map(plans.map((plan) => [plan.id, plan]));

const nowIso = () => new Date().toISOString();

export default function App({ storage = defaultStorage }: { storage?: PlannerStorage }) {
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
  }, [storage]);

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

  if (!isLoaded) {
    return (
      <main className="app-shell" aria-label="데스크톱 데일리 플래너">
        <div className="planner-layout planner-layout--loading">
          <section className="planner-panel planner-panel--main loading-panel" aria-live="polite">
            <span className="eyebrow">초기화</span>
            <h1>플래너를 불러오는 중입니다</h1>
            <p>저장된 계획을 확인하고 있습니다.</p>
          </section>
        </div>
      </main>
    );
  }

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

  const handleReorderDailyEntries = (activeId: string, overId: string) => {
    setPlannerState((current) => reorderDailyEntries(current, todayKey, activeId, overId));
  };

  const handleReorderDetailItems = (activeId: string, overId: string) => {
    if (!selectedEntryId) return;
    setPlannerState((current) => reorderDetailItems(current, todayKey, selectedEntryId, activeId, overId));
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
            onReorderDetailItems={handleReorderDetailItems}
          />
        ) : (
          <TodayPlannerView
            date={todayKey}
            entries={todayEntries}
            plansById={plansById}
            onOpenEntry={setSelectedEntryId}
            onAddPlanToToday={handleAddPlanToToday}
            onReorderDailyEntries={handleReorderDailyEntries}
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
