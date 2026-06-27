import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanLibraryPanel } from "./PlanLibraryPanel";
import type { LargePlan } from "../model/types";

const plan: LargePlan = {
  id: "plan-rust",
  title: "Rust 공부",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z"
};

const renderPanel = (overrides = {}) => {
  const props = {
    plans: [plan],
    onCreatePlan: vi.fn(),
    onUpdatePlan: vi.fn(),
    onDeletePlan: vi.fn(),
    syncStatus: "authenticated" as const,
    syncMessage: "회원가입 없이 로컬 서버 계정으로 로그인합니다.",
    loginRequiredMessage: "로그인하면 서버에 저장된 큰 계획을 불러옵니다.",
    onSyncLogin: vi.fn(),
    onSyncLogout: vi.fn(),
    ...overrides
  };
  render(<PlanLibraryPanel {...props} />);
  return props;
};

describe("PlanLibraryPanel", () => {
  it("creates plans from a popup instead of the inline library row", () => {
    const onCreatePlan = vi.fn();
    renderPanel({ onCreatePlan });

    expect(screen.queryByLabelText("새 큰 계획 제목")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "큰 계획 만들기" }));
    fireEvent.change(screen.getByLabelText("새 큰 계획 제목"), { target: { value: "알고리즘 복습" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));

    expect(onCreatePlan).toHaveBeenCalledWith("알고리즘 복습");
    expect(screen.queryByLabelText("새 큰 계획 제목")).toBeNull();
  });

  it("renders edit and delete actions instead of selected-date add actions", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: "Rust 공부 수정" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Rust 공부 삭제" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "선택 날짜 추가" })).toBeNull();
  });

  it("submits edited plan titles", () => {
    const onUpdatePlan = vi.fn();
    renderPanel({ onUpdatePlan });

    fireEvent.click(screen.getByRole("button", { name: "Rust 공부 수정" }));
    fireEvent.change(screen.getByLabelText("큰 계획 제목 수정"), { target: { value: "Rust 2회독" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onUpdatePlan).toHaveBeenCalledWith("plan-rust", "Rust 2회독");
  });

  it("deletes plans from the library", () => {
    const onDeletePlan = vi.fn();
    renderPanel({ onDeletePlan });

    fireEvent.click(screen.getByRole("button", { name: "Rust 공부 삭제" }));

    expect(onDeletePlan).toHaveBeenCalledWith("plan-rust");
  });
});
