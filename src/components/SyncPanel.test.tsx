import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncPanel } from "./SyncPanel";

describe("SyncPanel", () => {
  it("shows that login uses a fixed local account instead of signup", () => {
    render(
      <SyncPanel
        status="offline"
        message="회원가입 없이 로컬 서버 계정으로 로그인합니다."
        onLogin={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText("회원가입 없이 로컬 서버 계정으로 로그인합니다.")).not.toBeNull();
    expect(screen.getByLabelText("아이디")).not.toBeNull();
    expect(screen.getByLabelText("비밀번호")).not.toBeNull();
  });
});
