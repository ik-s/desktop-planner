import type { DailyPlanEntry, LargePlan } from "../model/types";
import { EmptyState } from "./EmptyState";
import { LargePlanCard } from "./LargePlanCard";

export type TodayPlannerViewProps = {
  date: string;
  entries: DailyPlanEntry[];
  plansById: Map<string, LargePlan>;
  onOpenEntry(entryId: string): void;
  onAddPlanToToday(planId: string): void;
};

const formatPlannerDate = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(`${date}T00:00:00`));

export function TodayPlannerView({
  date,
  entries,
  plansById,
  onOpenEntry,
  onAddPlanToToday
}: TodayPlannerViewProps) {
  const addedPlanIds = new Set(entries.map((entry) => entry.largePlanId));
  const availablePlans = [...plansById.values()].filter((plan) => !addedPlanIds.has(plan.id));

  return (
    <section className="planner-panel planner-panel--main" aria-labelledby="today-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">오늘의 플래너</span>
          <h1 id="today-title">{formatPlannerDate(date)}</h1>
        </div>
        <div className="quick-add" aria-label="오늘에 큰 계획 추가">
          {availablePlans.slice(0, 2).map((plan) => (
            <button key={plan.id} className="button button--soft" type="button" onClick={() => onAddPlanToToday(plan.id)}>
              + {plan.title}
            </button>
          ))}
        </div>
      </div>

      <div className="entry-stack">
        {entries.length > 0 ? (
          entries.map((entry) => {
            const plan = plansById.get(entry.largePlanId);
            if (!plan) return null;
            return <LargePlanCard key={entry.id} entry={entry} plan={plan} onOpen={() => onOpenEntry(entry.id)} />;
          })
        ) : (
          <EmptyState title="오늘 등록된 큰 계획이 없습니다" action="오른쪽 라이브러리에서 계획을 추가해 보세요." />
        )}
      </div>
    </section>
  );
}
