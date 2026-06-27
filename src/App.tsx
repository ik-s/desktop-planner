import { useEffect, useMemo, useState } from "react";
import { PlanDetailView } from "./components/PlanDetailView";
import { PlanLibraryPanel } from "./components/PlanLibraryPanel";
import { TodayPlannerView } from "./components/TodayPlannerView";
import type { SyncStatus } from "./components/SyncPanel";
import {
  addDetailItem,
  addLargePlan,
  addPlanToDate,
  createInitialState,
  removeLargePlan,
  removeDailyEntry,
  reorderDailyEntries,
  reorderDetailItems,
  updateLargePlanTitle,
  updateDailyEntryStatus,
  updateDetailItemStatus
} from "./model/plannerModel";
import type { LargePlan, PlannerState, PlannerStatus } from "./model/types";
import { createLocalPlannerStorage, type PlannerStorage } from "./storage/plannerStorage";
import { createPlanSyncClient, type PlanSyncClient } from "./sync/planSyncClient";

const defaultStorage = createLocalPlannerStorage();
const defaultSyncClient = createPlanSyncClient();
const offlineSyncMessage = "회원가입 없이 로컬 서버 계정으로 로그인합니다.";
const loginRequiredMessage = "로그인하면 서버에 저장된 큰 계획을 불러옵니다.";

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => formatDateKey(new Date());

const getPlansById = (plans: LargePlan[]) => new Map(plans.map((plan) => [plan.id, plan]));

const nowIso = () => new Date().toISOString();

const shiftDateKey = (dateKey: string, dayOffset: number) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayOffset);
  return formatDateKey(date);
};

export default function App({
  storage = defaultStorage,
  syncClient = defaultSyncClient
}: {
  storage?: PlannerStorage;
  syncClient?: PlanSyncClient;
}) {
  const [plannerState, setPlannerState] = useState<PlannerState>(() => createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState(() => getTodayKey());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    syncClient.getSession().isAuthenticated ? "syncing" : "offline"
  );
  const [syncMessage, setSyncMessage] = useState(() =>
    syncClient.getSession().isAuthenticated ? "서버 계획을 불러오는 중입니다." : offlineSyncMessage
  );

  useEffect(() => {
    let isActive = true;

    storage.loadState().then((loadedState) => {
      if (!isActive) return;
      setPlannerState(syncClient.getSession().isAuthenticated ? loadedState : { ...loadedState, largePlans: [] });
      setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, [storage, syncClient]);

  useEffect(() => {
    if (!isLoaded) return;
    void storage.saveState(plannerState);
  }, [isLoaded, plannerState]);

  const applyRemotePlans = async (remotePlans: LargePlan[]) => {
    let seedPlans: LargePlan[] | null = null;

    setPlannerState((current) => {
      if (remotePlans.length === 0 && current.largePlans.length > 0) {
        seedPlans = current.largePlans;
        return current;
      }

      return { ...current, largePlans: remotePlans };
    });

    if (seedPlans) {
      await syncClient.savePlans(seedPlans);
    }
  };

  useEffect(() => {
    if (!isLoaded || !syncClient.getSession().isAuthenticated) return;
    let isActive = true;

    setSyncStatus("syncing");
    setSyncMessage("서버 계획을 불러오는 중입니다.");

    syncClient
      .loadPlans()
      .then(async (plans) => {
        if (!isActive) return;
        await applyRemotePlans(plans);
        if (!isActive) return;
        setSyncStatus("authenticated");
        setSyncMessage("큰 계획을 서버에 저장 중입니다.");
      })
      .catch(() => {
        if (!isActive) return;
        setSyncStatus("error");
        setSyncMessage("서버 연결에 실패했습니다. 로컬 저장으로 계속 사용할 수 있습니다.");
      });

    return () => {
      isActive = false;
    };
  }, [isLoaded, syncClient]);

  useEffect(() => {
    if (!isLoaded || syncStatus !== "authenticated") return;

    syncClient
      .savePlans(plannerState.largePlans)
      .then(() => {
        setSyncMessage("큰 계획이 서버에 저장되어 있습니다.");
      })
      .catch(() => {
        setSyncStatus("authenticated");
        setSyncMessage("서버 저장에 실패했습니다. 저장소 설정을 확인하세요.");
      });
  }, [isLoaded, plannerState.largePlans, syncClient, syncStatus]);

  const selectedDateEntries = plannerState.dailyEntries[selectedDateKey] ?? [];
  const plansById = useMemo(() => getPlansById(plannerState.largePlans), [plannerState.largePlans]);
  const selectedEntry = selectedEntryId
    ? selectedDateEntries.find((entry) => entry.id === selectedEntryId)
    : undefined;
  const selectedPlan = selectedEntry ? plansById.get(selectedEntry.largePlanId) : undefined;

  useEffect(() => {
    if (selectedEntryId && !selectedDateEntries.some((entry) => entry.id === selectedEntryId)) {
      setSelectedEntryId(null);
    }
  }, [selectedEntryId, selectedDateEntries]);

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

  const handleUpdatePlan = (planId: string, title: string) => {
    setPlannerState((current) => updateLargePlanTitle(current, planId, title, nowIso()));
  };

  const handleDeletePlan = (planId: string) => {
    setPlannerState((current) => removeLargePlan(current, planId));
  };

  const handleSyncLogin = async (username: string, password: string) => {
    setSyncStatus("syncing");
    setSyncMessage("로그인 중입니다.");

    try {
      await syncClient.login(username, password);
    } catch {
      setSyncStatus("error");
      setSyncMessage("로그인에 실패했습니다. 로컬 서버 계정과 비밀번호를 확인하세요.");
      return;
    }

    try {
      await applyRemotePlans(await syncClient.loadPlans());
      setSyncStatus("authenticated");
      setSyncMessage("큰 계획이 서버에 저장되어 있습니다.");
    } catch {
      setSyncStatus("authenticated");
      setSyncMessage("서버 저장에 실패했습니다. 저장소 설정을 확인하세요.");
    }
  };

  const handleSyncLogout = () => {
    syncClient.logout();
    setSyncStatus("offline");
    setSyncMessage(offlineSyncMessage);
  };

  const handleAddPlanToToday = (planId: string) => {
    setPlannerState((current) => addPlanToDate(current, selectedDateKey, planId, nowIso()));
  };

  const handleAddDetailItem = (entryId: string, title: string) => {
    setPlannerState((current) => addDetailItem(current, selectedDateKey, entryId, title, nowIso()));
  };

  const handleDailyEntryStatusChange = (entryId: string, status: PlannerStatus) => {
    setPlannerState((current) => updateDailyEntryStatus(current, selectedDateKey, entryId, status, nowIso()));
  };

  const handleDetailItemStatusChange = (entryId: string, itemId: string, status: PlannerStatus) => {
    setPlannerState((current) => updateDetailItemStatus(current, selectedDateKey, entryId, itemId, status, nowIso()));
  };

  const handleReorderDailyEntries = (activeId: string, overId: string) => {
    setPlannerState((current) => reorderDailyEntries(current, selectedDateKey, activeId, overId));
  };

  const handleRemoveDailyEntry = (entryId: string) => {
    setPlannerState((current) => removeDailyEntry(current, selectedDateKey, entryId));
  };

  const handleReorderDetailItems = (activeId: string, overId: string) => {
    if (!selectedEntryId) return;
    setPlannerState((current) => reorderDetailItems(current, selectedDateKey, selectedEntryId, activeId, overId));
  };

  const handlePreviousDate = () => {
    setSelectedDateKey((current) => shiftDateKey(current, -1));
  };

  const handleNextDate = () => {
    setSelectedDateKey((current) => shiftDateKey(current, 1));
  };

  const handleTodayDate = () => {
    setSelectedDateKey(getTodayKey());
  };

  return (
    <main className="app-shell" aria-label="데스크톱 데일리 플래너">
      <div className="planner-layout">
        {selectedEntry && selectedPlan ? (
          <PlanDetailView
            date={selectedDateKey}
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
            date={selectedDateKey}
            entries={selectedDateEntries}
            plansById={plansById}
            onOpenEntry={setSelectedEntryId}
            onRemoveEntry={handleRemoveDailyEntry}
            onAddPlanToToday={handleAddPlanToToday}
            onReorderDailyEntries={handleReorderDailyEntries}
            onDateChange={setSelectedDateKey}
            onPreviousDate={handlePreviousDate}
            onNextDate={handleNextDate}
            onTodayDate={handleTodayDate}
          />
        )}

        <PlanLibraryPanel
          plans={plannerState.largePlans}
          onCreatePlan={handleCreatePlan}
          onUpdatePlan={handleUpdatePlan}
          onDeletePlan={handleDeletePlan}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
          loginRequiredMessage={loginRequiredMessage}
          onSyncLogin={handleSyncLogin}
          onSyncLogout={handleSyncLogout}
        />
      </div>
    </main>
  );
}
