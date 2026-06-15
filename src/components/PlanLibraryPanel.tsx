import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import type { LargePlan } from "../model/types";
import { EmptyState } from "./EmptyState";

export function PlanLibraryPanel({
  plans,
  todayPlanIds,
  onCreatePlan,
  onAddPlanToToday
}: {
  plans: LargePlan[];
  todayPlanIds: Set<string>;
  onCreatePlan(title: string): void;
  onAddPlanToToday(planId: string): void;
}) {
  const [title, setTitle] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreatePlan(title);
    setTitle("");
  };

  return (
    <aside className="planner-panel library-panel" aria-labelledby="library-title">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="eyebrow">큰 계획 보관함</span>
          <h2 id="library-title">계획 라이브러리</h2>
        </div>
      </div>

      <form className="create-plan-form" onSubmit={handleSubmit}>
        <label htmlFor="plan-title">새 큰 계획</label>
        <div className="input-row">
          <input
            id="plan-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 알고리즘 복습"
          />
          <button className="icon-button" type="submit" aria-label="큰 계획 만들기">
            <Plus size={20} aria-hidden />
          </button>
        </div>
      </form>

      <div className="library-list">
        {plans.length > 0 ? (
          plans.map((plan) => {
            const isAdded = todayPlanIds.has(plan.id);
            return (
              <div className="library-item" key={plan.id}>
                <strong>{plan.title}</strong>
                <button
                  className={isAdded ? "button button--ghost" : "button button--green"}
                  type="button"
                  disabled={isAdded}
                  onClick={() => onAddPlanToToday(plan.id)}
                >
                  {isAdded ? "추가됨" : "오늘 추가"}
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState title="저장된 큰 계획이 없습니다" action="반복할 계획을 먼저 만들어 보세요." />
        )}
      </div>
    </aside>
  );
}
