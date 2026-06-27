import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { LargePlan } from "../model/types";
import { EmptyState } from "./EmptyState";
import { SyncPanel, type SyncStatus } from "./SyncPanel";

export function PlanLibraryPanel({
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  syncStatus,
  syncMessage,
  loginRequiredMessage,
  onSyncLogin,
  onSyncLogout
}: {
  plans: LargePlan[];
  onCreatePlan(title: string): void;
  onUpdatePlan(planId: string, title: string): void;
  onDeletePlan(planId: string): void;
  syncStatus: SyncStatus;
  syncMessage: string;
  loginRequiredMessage: string;
  onSyncLogin(username: string, password: string): Promise<void>;
  onSyncLogout(): void;
}) {
  const [title, setTitle] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const isAuthenticated = syncStatus === "authenticated";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onCreatePlan(nextTitle);
    setTitle("");
    setIsCreateDialogOpen(false);
  };

  const closeCreateDialog = () => {
    setTitle("");
    setIsCreateDialogOpen(false);
  };

  const beginEdit = (plan: LargePlan) => {
    setEditingPlanId(plan.id);
    setEditingTitle(plan.title);
  };

  const cancelEdit = () => {
    setEditingPlanId(null);
    setEditingTitle("");
  };

  const saveEdit = () => {
    if (!editingPlanId) return;
    onUpdatePlan(editingPlanId, editingTitle);
    cancelEdit();
  };

  return (
    <aside className="planner-panel library-panel" aria-labelledby="library-title">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="eyebrow">큰 계획 보관함</span>
          <h2 id="library-title">계획 라이브러리</h2>
        </div>
      </div>

      <SyncPanel status={syncStatus} message={syncMessage} onLogin={onSyncLogin} onLogout={onSyncLogout} />

      {isAuthenticated ? (
        <>
          <div className="create-plan-form">
            <span className="create-plan-form__label">새 큰 계획</span>
            <button className="button button--green create-plan-trigger" type="button" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus size={18} aria-hidden />
              큰 계획 만들기
            </button>
          </div>

          {isCreateDialogOpen ? (
            <div className="modal-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
              <section
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-plan-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="modal-heading">
                  <div>
                    <span className="eyebrow">큰 계획</span>
                    <h3 id="create-plan-dialog-title">새 큰 계획 만들기</h3>
                  </div>
                  <button className="icon-button icon-button--ghost" type="button" onClick={closeCreateDialog}>
                    <X size={18} aria-hidden />
                    <span className="sr-only">닫기</span>
                  </button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                  <label htmlFor="plan-title">새 큰 계획 제목</label>
                  <input
                    id="plan-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="예: 알고리즘 복습"
                    autoFocus
                  />
                  <div className="modal-actions">
                    <button className="button button--ghost" type="button" onClick={closeCreateDialog}>
                      취소
                    </button>
                    <button className="button button--green" type="submit" disabled={!title.trim()}>
                      <Plus size={20} aria-hidden />
                      추가
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : null}

          <div className="library-list">
            {plans.length > 0 ? (
          plans.map((plan) => (
            <div className="library-item" key={plan.id}>
              {editingPlanId === plan.id ? (
                <label className="library-edit-field">
                  <span>큰 계획 제목 수정</span>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                  />
                </label>
              ) : (
                <strong>{plan.title}</strong>
              )}

              <div className="library-item__actions">
                {editingPlanId === plan.id ? (
                  <>
                    <button className="icon-button icon-button--green" type="button" onClick={saveEdit}>
                      <Check size={18} aria-hidden />
                      <span className="sr-only">저장</span>
                    </button>
                    <button className="icon-button icon-button--ghost" type="button" onClick={cancelEdit}>
                      <X size={18} aria-hidden />
                      <span className="sr-only">취소</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="icon-button icon-button--ghost" type="button" onClick={() => beginEdit(plan)}>
                      <Pencil size={18} aria-hidden />
                      <span className="sr-only">{plan.title} 수정</span>
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => onDeletePlan(plan.id)}
                    >
                      <Trash2 size={18} aria-hidden />
                      <span className="sr-only">{plan.title} 삭제</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
            ) : (
              <EmptyState title="저장된 큰 계획이 없습니다" action="반복할 계획을 먼저 만들어 보세요." />
            )}
          </div>
        </>
      ) : (
        <EmptyState title="로그인이 필요합니다" action={loginRequiredMessage} />
      )}
    </aside>
  );
}
