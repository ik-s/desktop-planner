import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { formatDateKey } from "./App";
import { PlanDetailView } from "./components/PlanDetailView";
import type { DailyPlanEntry, LargePlan, PlannerState } from "./model/types";
import type { PlannerStorage } from "./storage/plannerStorage";

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
      />
    );

    const detailInput = document.querySelector<HTMLInputElement>("#detail-item-title");
    const submitButton = document.querySelector<HTMLButtonElement>(".add-detail-form button[type='submit']");

    expect(detailInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    fireEvent.change(detailInput!, { target: { value: "   " } });

    expect(submitButton).toHaveProperty("disabled", true);
  });
});

describe("App planner persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts empty, wires real planner actions, and reloads persisted state", async () => {
    const firstRender = render(<App />);

    await screen.findByText("오늘 등록된 큰 계획이 없습니다");
    expect(screen.queryByText(/Rust/)).toBeNull();

    fireEvent.change(screen.getByLabelText("새 큰 계획"), { target: { value: "운동" } });
    fireEvent.click(screen.getByRole("button", { name: "큰 계획 만들기" }));
    fireEvent.click(screen.getByRole("button", { name: "오늘 추가" }));

    fireEvent.click(screen.getByRole("button", { name: /운동/ }));

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
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /운동/ }));
    expect(await screen.findByText("스트레칭")).not.toBeNull();
    expect(screen.getByLabelText("계획 상태")).toHaveProperty("value", "in_progress");
    expect(screen.getByLabelText("스트레칭 상태")).toHaveProperty("value", "done");
  });
});
