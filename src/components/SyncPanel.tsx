import { FormEvent, useState } from "react";

export type SyncStatus = "offline" | "syncing" | "authenticated" | "error";

export function SyncPanel({
  status,
  message,
  onLogin,
  onLogout
}: {
  status: SyncStatus;
  message: string;
  onLogin(username: string, password: string): Promise<void>;
  onLogout(): void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isAuthenticated = status === "authenticated";
  const isBusy = status === "syncing";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(username, password);
    setPassword("");
  };

  return (
    <section className="sync-panel" aria-label="서버 동기화">
      <div className="sync-panel__heading">
        <strong>서버 저장</strong>
        <span className={`sync-dot sync-dot--${status}`} aria-hidden />
      </div>
      <p>{message}</p>

      {isAuthenticated ? (
        <button className="button button--ghost sync-panel__full-button" type="button" onClick={onLogout}>
          로그아웃
        </button>
      ) : (
        <form className="sync-form" onSubmit={handleSubmit}>
          <label htmlFor="sync-username">아이디</label>
          <input
            id="sync-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />

          <label htmlFor="sync-password">비밀번호</label>
          <input
            id="sync-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <button className="button button--green sync-panel__full-button" type="submit" disabled={isBusy}>
            {isBusy ? "동기화 중" : "로그인"}
          </button>
        </form>
      )}
    </section>
  );
}
