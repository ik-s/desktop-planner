import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

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
