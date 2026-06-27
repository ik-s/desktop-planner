import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { formatDateKey } from "./App";
import { PlanDetailView } from "./components/PlanDetailView";
import { TodayPlannerView } from "./components/TodayPlannerView";
import type { DailyPlanEntry, LargePlan, PlannerState } from "./model/types";
import type { PlannerStorage } from "./storage/plannerStorage";
import type { PlanSyncClient } from "./sync/planSyncClient";

describe("formatDateKey", () => {
  it("formats from local date getters instead of UTC ISO output", () => {
    const fakeLocalDate = {
      getFullYear: () => 2026,
      getMonth: () => 5,
      getDate: () => 15,
      toISOString: () => {
        throw new Error("formatDateKey must not use UTC ISO formatting");
      }
    } as unknown as Date;

    expect(formatDateKey(fakeLocalDate)).toBe("2026-06-15");
  });
});

describe("App hydration", () => {
  it("does not expose planner interactions before persisted state loads", () => {
    const loadPromise = new Promise<PlannerState>(() => undefined);
    const delayedStorage: PlannerStorage = {
      loadState: () => loadPromise,
      saveState: vi.fn()
    };

    render(<App storage={delayedStorage} />);

    expect(screen.getByText("플래너를 불러오는 중입니다")).not.toBeNull();
    expect(screen.queryByLabelText("새 큰 계획")).toBeNull();
  });
});

describe("PlanDetailView", () => {
  it("keeps whitespace-only detail submissions unavailable", () => {
    const entry: DailyPlanEntry = {
      id: "entry-1",
      date: "2026-06-15",
      largePlanId: "plan-1",
      order: 0,
      status: "waiting",
      detailItems: [],
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };
    const plan: LargePlan = {
      id: "plan-1",
      title: "운동",
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };

    render(
      <PlanDetailView
        date="2026-06-15"
        entry={entry}
        plan={plan}
        onBack={vi.fn()}
        onAddDetailItem={vi.fn()}
        onEntryStatusChange={vi.fn()}
        onDetailItemStatusChange={vi.fn()}
        onDetailItemTitleChange={vi.fn()}
        onRemoveDetailItem={vi.fn()}
        onReorderDetailItems={vi.fn()}
      />
    );

    const detailInput = document.querySelector<HTMLInputElement>("#detail-item-title");
    const submitButton = document.querySelector<HTMLButtonElement>(".add-detail-form button[type='submit']");

    expect(detailInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    fireEvent.change(detailInput!, { target: { value: "   " } });

    expect(submitButton).toHaveProperty("disabled", true);
  });

  it("renders detail item drag handles without replacing status controls", () => {
    const entry: DailyPlanEntry = {
      id: "entry-1",
      date: "2026-06-15",
      largePlanId: "plan-1",
      order: 0,
      status: "waiting",
      detailItems: [
        {
          id: "item-1",
          title: "First detail",
          order: 0,
          status: "waiting",
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        },
        {
          id: "item-2",
          title: "Second detail",
          order: 1,
          status: "done",
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        }
      ],
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };
    const plan: LargePlan = {
      id: "plan-1",
      title: "Focus Plan",
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };

    render(
      <PlanDetailView
        date="2026-06-15"
        entry={entry}
        plan={plan}
        onBack={vi.fn()}
        onAddDetailItem={vi.fn()}
        onEntryStatusChange={vi.fn()}
        onDetailItemStatusChange={vi.fn()}
        onDetailItemTitleChange={vi.fn()}
        onRemoveDetailItem={vi.fn()}
        onReorderDetailItems={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "First detail 세부 항목 순서 변경" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Second detail 세부 항목 순서 변경" })).not.toBeNull();
    expect(screen.getByLabelText("First detail 상태")).toHaveProperty("value", "waiting");
    expect(screen.getByLabelText("Second detail 상태")).toHaveProperty("value", "done");
  });
  it("allows detail items to be edited and removed", () => {
    const entry: DailyPlanEntry = {
      id: "entry-1",
      date: "2026-06-15",
      largePlanId: "plan-1",
      order: 0,
      status: "waiting",
      detailItems: [
        {
          id: "item-1",
          title: "First detail",
          order: 0,
          status: "waiting",
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        }
      ],
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };
    const plan: LargePlan = {
      id: "plan-1",
      title: "Focus Plan",
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z"
    };
    const onDetailItemTitleChange = vi.fn();
    const onRemoveDetailItem = vi.fn();

    render(
      <PlanDetailView
        date="2026-06-15"
        entry={entry}
        plan={plan}
        onBack={vi.fn()}
        onAddDetailItem={vi.fn()}
        onEntryStatusChange={vi.fn()}
        onDetailItemStatusChange={vi.fn()}
        onDetailItemTitleChange={onDetailItemTitleChange}
        onRemoveDetailItem={onRemoveDetailItem}
        onReorderDetailItems={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "First detail 수정" }));
    fireEvent.change(screen.getByLabelText("First detail 제목 수정"), { target: { value: "Updated detail" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onDetailItemTitleChange).toHaveBeenCalledWith("entry-1", "item-1", "Updated detail");

    fireEvent.click(screen.getByRole("button", { name: "First detail 삭제" }));

    expect(onRemoveDetailItem).toHaveBeenCalledWith("entry-1", "item-1");
  });
});

describe("TodayPlannerView", () => {
  it("renders card drag handles while preserving card click navigation", () => {
    const entries: DailyPlanEntry[] = [
      {
        id: "entry-1",
        date: "2026-06-15",
        largePlanId: "plan-1",
        order: 0,
        status: "waiting",
        detailItems: [],
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z"
      },
      {
        id: "entry-2",
        date: "2026-06-15",
        largePlanId: "plan-2",
        order: 1,
        status: "in_progress",
        detailItems: [],
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z"
      }
    ];
    const plansById = new Map<string, LargePlan>([
      [
        "plan-1",
        {
          id: "plan-1",
          title: "First plan",
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        }
      ],
      [
        "plan-2",
        {
          id: "plan-2",
          title: "Second plan",
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        }
      ]
    ]);
    const onOpenEntry = vi.fn();
    const onRemoveEntry = vi.fn();

    render(
      <TodayPlannerView
        date="2026-06-15"
        entries={entries}
        plansById={plansById}
        onOpenEntry={onOpenEntry}
        onRemoveEntry={onRemoveEntry}
        onAddPlanToToday={vi.fn()}
        onReorderDailyEntries={vi.fn()}
        onDateChange={vi.fn()}
        onPreviousDate={vi.fn()}
        onNextDate={vi.fn()}
        onTodayDate={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "First plan 순서 변경" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Second plan 순서 변경" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "First plan 대기" }));

    expect(onOpenEntry).toHaveBeenCalledWith("entry-1");

    fireEvent.click(screen.getByRole("button", { name: "First plan 삭제" }));

    expect(onRemoveEntry).toHaveBeenCalledWith("entry-1");
  });

  it("shows every available large plan in the selected date quick-add area", () => {
    const entries: DailyPlanEntry[] = [
      {
        id: "entry-1",
        date: "2026-06-15",
        largePlanId: "plan-1",
        order: 0,
        status: "waiting",
        detailItems: [],
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z"
      }
    ];
    const plansById = new Map<string, LargePlan>(
      ["Rust 학습", "헬스", "영어 회화", "De-Buthon"].map((title, index) => [
        `plan-${index + 1}`,
        {
          id: `plan-${index + 1}`,
          title,
          createdAt: "2026-06-15T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z"
        }
      ])
    );
    const onAddPlanToToday = vi.fn();

    render(
      <TodayPlannerView
        date="2026-06-15"
        entries={entries}
        plansById={plansById}
        onOpenEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onAddPlanToToday={onAddPlanToToday}
        onReorderDailyEntries={vi.fn()}
        onDateChange={vi.fn()}
        onPreviousDate={vi.fn()}
        onNextDate={vi.fn()}
        onTodayDate={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "+ Rust 학습" })).toBeNull();
    expect(screen.getByRole("button", { name: "+ 헬스" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "+ 영어 회화" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "+ De-Buthon" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "+ De-Buthon" }));

    expect(onAddPlanToToday).toHaveBeenCalledWith("plan-4");
  });
});

describe("App planner persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  const shiftDateKey = (dateKey: string, dayOffset: number) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + dayOffset);
    return formatDateKey(date);
  };

  const createAuthenticatedSyncClient = (): PlanSyncClient => ({
    getSession: () => ({ isAuthenticated: true }),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    loadState: vi.fn().mockResolvedValue({ largePlans: [], dailyEntries: {} }),
    saveState: vi.fn().mockResolvedValue(undefined),
    loadPlans: vi.fn().mockResolvedValue([]),
    savePlans: vi.fn().mockResolvedValue(undefined)
  });

  it("keeps entries and detail items isolated by selected date and restores past days", async () => {
    render(<App syncClient={createAuthenticatedSyncClient()} />);

    const dateInput = (await screen.findByLabelText("날짜 선택")) as HTMLInputElement;
    const originalDateKey = dateInput.value;
    const otherDateKey = shiftDateKey(originalDateKey, -1);

    expect(screen.getByRole("button", { name: "이전 날" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "다음 날" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "오늘" })).not.toBeNull();

    fireEvent.click(await screen.findByRole("button", { name: "큰 계획 만들기" }));
    fireEvent.change(await screen.findByLabelText("새 큰 계획 제목"), { target: { value: "테스트 계획" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.click(await screen.findByRole("button", { name: "+ 테스트 계획" }));

    fireEvent.click(document.querySelector<HTMLButtonElement>(".large-plan-card__open")!);
    fireEvent.change(document.querySelector<HTMLInputElement>("#detail-item-title")!, {
      target: { value: "첫 번째 세부 항목" }
    });
    fireEvent.click(document.querySelector<HTMLButtonElement>(".add-detail-form button[type='submit']")!);
    expect(await screen.findByText("첫 번째 세부 항목")).not.toBeNull();

    fireEvent.click(document.querySelector<HTMLButtonElement>(".back-button")!);
    fireEvent.change(screen.getByLabelText("날짜 선택"), { target: { value: otherDateKey } });

    expect(document.querySelector<HTMLButtonElement>(".large-plan-card__open")).toBeNull();
    expect(screen.queryByText("첫 번째 세부 항목")).toBeNull();

    fireEvent.change(screen.getByLabelText("날짜 선택"), { target: { value: originalDateKey } });

    expect(document.querySelector<HTMLButtonElement>(".large-plan-card__open")).not.toBeNull();
    fireEvent.click(document.querySelector<HTMLButtonElement>(".large-plan-card__open")!);
    expect(await screen.findByText("첫 번째 세부 항목")).not.toBeNull();
  });

  it("starts empty, wires real planner actions, and reloads persisted state", async () => {
    const firstRender = render(<App syncClient={createAuthenticatedSyncClient()} />);

    await screen.findByText("선택한 날짜에 등록된 큰 계획이 없습니다");
    expect(screen.queryByText(/Rust/)).toBeNull();

    fireEvent.click(await screen.findByRole("button", { name: "큰 계획 만들기" }));
    fireEvent.change(await screen.findByLabelText("새 큰 계획 제목"), { target: { value: "운동" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.click(screen.getByRole("button", { name: "+ 운동" }));

    fireEvent.click(screen.getByRole("button", { name: "운동 대기" }));

    fireEvent.change(screen.getByLabelText("계획 상태"), { target: { value: "in_progress" } });
    fireEvent.change(screen.getByLabelText("세부 항목"), { target: { value: "스트레칭" } });
    fireEvent.click(screen.getByRole("button", { name: "세부 항목 추가" }));
    fireEvent.change(screen.getByLabelText("스트레칭 상태"), { target: { value: "done" } });

    await waitFor(() => {
      const saved = localStorage.getItem("desktop-planner:v1");
      expect(saved).not.toBeNull();
      expect(saved).toContain("운동");
      expect(saved).toContain("스트레칭");
      expect(saved).toContain("done");
    });

    firstRender.unmount();
    render(<App syncClient={createAuthenticatedSyncClient()} />);

    fireEvent.click(await screen.findByRole("button", { name: /운동.*진행중/ }));
    expect(await screen.findByText("스트레칭")).not.toBeNull();
    expect(screen.getByLabelText("계획 상태")).toHaveProperty("value", "in_progress");
    expect(screen.getByLabelText("스트레칭 상태")).toHaveProperty("value", "done");
  });

  it("loads server large plans after login", async () => {
    const remotePlan: LargePlan = {
      id: "plan-remote-rust",
      title: "Rust 공부",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    };
    const syncClient: PlanSyncClient = {
      getSession: () => ({ isAuthenticated: false }),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      loadState: vi.fn().mockResolvedValue({ largePlans: [remotePlan], dailyEntries: {} }),
      saveState: vi.fn().mockResolvedValue(undefined),
      loadPlans: vi.fn().mockResolvedValue([remotePlan]),
      savePlans: vi.fn().mockResolvedValue(undefined)
    };

    render(<App syncClient={syncClient} />);

    fireEvent.change(await screen.findByLabelText("아이디"), { target: { value: "me" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("Rust 공부")).not.toBeNull();
    expect(syncClient.login).toHaveBeenCalledWith("me", "secret");
  });

  it("refreshes authenticated planner state when the browser regains focus", async () => {
    const dateKey = formatDateKey(new Date());
    const remotePlan: LargePlan = {
      id: "plan-rust",
      title: "Rust",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    };
    const baseEntry: DailyPlanEntry = {
      id: "entry-rust",
      date: dateKey,
      largePlanId: remotePlan.id,
      order: 0,
      status: "waiting",
      detailItems: [],
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    };
    const focusedState: PlannerState = {
      largePlans: [remotePlan],
      dailyEntries: {
        [dateKey]: [
          {
            ...baseEntry,
            detailItems: [
              {
                id: "detail-rust",
                title: "Synced detail",
                order: 0,
                status: "waiting",
                createdAt: "2026-06-28T00:00:00.000Z",
                updatedAt: "2026-06-28T00:00:00.000Z"
              }
            ]
          }
        ]
      }
    };
    const syncClient: PlanSyncClient = {
      getSession: () => ({ isAuthenticated: true }),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      loadState: vi
        .fn()
        .mockResolvedValueOnce({ largePlans: [remotePlan], dailyEntries: { [dateKey]: [baseEntry] } })
        .mockResolvedValueOnce(focusedState),
      saveState: vi.fn().mockResolvedValue(undefined),
      loadPlans: vi.fn().mockResolvedValue([remotePlan]),
      savePlans: vi.fn().mockResolvedValue(undefined)
    };

    render(<App syncClient={syncClient} />);

    await waitFor(() => expect(document.querySelector<HTMLButtonElement>(".large-plan-card__open")).not.toBeNull());
    fireEvent.click(document.querySelector<HTMLButtonElement>(".large-plan-card__open")!);
    expect(screen.queryByText("Synced detail")).toBeNull();

    window.dispatchEvent(new Event("focus"));

    expect(await screen.findByText("Synced detail")).not.toBeNull();
  });

  it("keeps local detail entries when migrating from legacy server plans", async () => {
    const dateKey = formatDateKey(new Date());
    const plan: LargePlan = {
      id: "plan-rust",
      title: "Rust",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    };
    const localState: PlannerState = {
      largePlans: [plan],
      dailyEntries: {
        [dateKey]: [
          {
            id: "entry-rust",
            date: dateKey,
            largePlanId: plan.id,
            order: 0,
            status: "waiting",
            createdAt: "2026-06-28T00:00:00.000Z",
            updatedAt: "2026-06-28T00:00:00.000Z",
            detailItems: [
              {
                id: "detail-local",
                title: "Local detail",
                order: 0,
                status: "waiting",
                createdAt: "2026-06-28T00:00:00.000Z",
                updatedAt: "2026-06-28T00:00:00.000Z"
              }
            ]
          }
        ]
      }
    };
    const storage: PlannerStorage = {
      loadState: vi.fn().mockResolvedValue(localState),
      saveState: vi.fn().mockResolvedValue(undefined)
    };
    const syncClient: PlanSyncClient = {
      getSession: () => ({ isAuthenticated: true }),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      loadState: vi.fn().mockResolvedValue({ largePlans: [plan], dailyEntries: {} }),
      saveState: vi.fn().mockResolvedValue(undefined),
      loadPlans: vi.fn().mockResolvedValue([plan]),
      savePlans: vi.fn().mockResolvedValue(undefined)
    };

    render(<App storage={storage} syncClient={syncClient} />);

    await waitFor(() => {
      expect(syncClient.saveState).toHaveBeenCalledWith(localState);
    });
    fireEvent.click(document.querySelector<HTMLButtonElement>(".large-plan-card__open")!);

    expect(await screen.findByText("Local detail")).not.toBeNull();
  });

  it("keeps the user logged in when plan loading fails after authentication", async () => {
    const syncClient: PlanSyncClient = {
      getSession: () => ({ isAuthenticated: false }),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      loadState: vi.fn().mockRejectedValue(new Error("storage_missing")),
      saveState: vi.fn().mockRejectedValue(new Error("storage_missing")),
      loadPlans: vi.fn().mockRejectedValue(new Error("storage_missing")),
      savePlans: vi.fn().mockRejectedValue(new Error("storage_missing"))
    };

    render(<App syncClient={syncClient} />);

    fireEvent.change(await screen.findByLabelText("아이디"), { target: { value: "me" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("button", { name: "로그아웃" })).not.toBeNull();
    expect(await screen.findByRole("button", { name: "큰 계획 만들기" })).not.toBeNull();
    expect(await screen.findByText("서버 저장에 실패했습니다. 저장소 설정을 확인하세요.")).not.toBeNull();
  });

  it("hides locally persisted large plans until server login succeeds", async () => {
    const localPlan: LargePlan = {
      id: "plan-local",
      title: "로컬에만 있던 계획",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    };
    const storage: PlannerStorage = {
      loadState: vi.fn().mockResolvedValue({ largePlans: [localPlan], dailyEntries: {} }),
      saveState: vi.fn().mockResolvedValue(undefined)
    };
    const syncClient: PlanSyncClient = {
      getSession: () => ({ isAuthenticated: false }),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      loadState: vi.fn().mockResolvedValue({ largePlans: [], dailyEntries: {} }),
      saveState: vi.fn().mockResolvedValue(undefined),
      loadPlans: vi.fn().mockResolvedValue([]),
      savePlans: vi.fn().mockResolvedValue(undefined)
    };

    render(<App storage={storage} syncClient={syncClient} />);

    await screen.findByText("로그인하면 서버에 저장된 큰 계획을 불러옵니다.");
    expect(screen.queryByText("로컬에만 있던 계획")).toBeNull();
    expect(screen.queryByLabelText("새 큰 계획")).toBeNull();
  });

  it("explains that sync login uses a fixed local account", async () => {
    render(<App />);

    expect(await screen.findByText("회원가입 없이 로컬 서버 계정으로 로그인합니다.")).not.toBeNull();
  });
});
