import { ArrowLeft } from "lucide-react";
import type { DailyPlanEntry, LargePlan } from "../model/types";
import { DetailItemRow } from "./DetailItemRow";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

export function PlanDetailView({
  date,
  entry,
  plan,
  onBack
}: {
  date: string;
  entry: DailyPlanEntry;
  plan: LargePlan;
  onBack(): void;
}) {
  return (
    <section className="planner-panel planner-panel--main" aria-labelledby="detail-title">
      <button className="button button--ghost back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden />
        오늘 계획
      </button>

      <div className="panel-heading panel-heading--detail">
        <div>
          <span className="eyebrow">{date}</span>
          <h1 id="detail-title">{plan.title}</h1>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <div className="detail-list">
        {entry.detailItems.length > 0 ? (
          entry.detailItems.map((item) => <DetailItemRow key={item.id} item={item} />)
        ) : (
          <EmptyState title="세부 항목이 없습니다" action="다음 단계에서 세부 항목 입력과 저장이 연결됩니다." />
        )}
      </div>
    </section>
  );
}
