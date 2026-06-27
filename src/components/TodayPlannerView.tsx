import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DailyPlanEntry, LargePlan } from "../model/types";
import { EmptyState } from "./EmptyState";
import { LargePlanCard } from "./LargePlanCard";

export type TodayPlannerViewProps = {
  date: string;
  entries: DailyPlanEntry[];
  plansById: Map<string, LargePlan>;
  onOpenEntry(entryId: string): void;
  onRemoveEntry(entryId: string): void;
  onAddPlanToToday(planId: string): void;
  onReorderDailyEntries(activeId: string, overId: string): void;
  onDateChange(date: string): void;
  onPreviousDate(): void;
  onNextDate(): void;
  onTodayDate(): void;
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
  onRemoveEntry,
  onAddPlanToToday,
  onReorderDailyEntries,
  onDateChange,
  onPreviousDate,
  onNextDate,
  onTodayDate
}: TodayPlannerViewProps) {
  const addedPlanIds = new Set(entries.map((entry) => entry.largePlanId));
  const availablePlans = [...plansById.values()].filter((plan) => !addedPlanIds.has(plan.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderDailyEntries(String(active.id), String(over.id));
  };

  return (
    <section className="planner-panel planner-panel--main" aria-labelledby="today-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">선택한 날짜의 플래너</span>
          <h1 id="today-title">{formatPlannerDate(date)}</h1>
        </div>
        <div className="planner-heading-actions">
          <div className="date-navigation" aria-label="날짜 탐색">
            <button className="button button--ghost" type="button" onClick={onPreviousDate}>
              이전 날
            </button>
            <label className="date-picker">
              <span>날짜 선택</span>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  if (event.target.value) onDateChange(event.target.value);
                }}
              />
            </label>
            <button className="button button--ghost" type="button" onClick={onNextDate}>
              다음 날
            </button>
            <button className="button button--soft" type="button" onClick={onTodayDate}>
              오늘
            </button>
          </div>
          <div className="quick-add" aria-label="선택한 날짜에 큰 계획 추가">
            {availablePlans.slice(0, 2).map((plan) => (
              <button
                key={plan.id}
                className="button button--soft"
                type="button"
                onClick={() => onAddPlanToToday(plan.id)}
              >
                + {plan.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {entries.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={entries.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
            <div className="entry-stack">
              {entries.map((entry) => {
                const plan = plansById.get(entry.largePlanId);
                if (!plan) return null;
                return (
                  <LargePlanCard
                    key={entry.id}
                    entry={entry}
                    plan={plan}
                    onOpen={() => onOpenEntry(entry.id)}
                    onRemove={() => onRemoveEntry(entry.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="entry-stack">
          <EmptyState title="선택한 날짜에 등록된 큰 계획이 없습니다" action="오른쪽 라이브러리에서 계획을 추가해 보세요." />
        </div>
      )}
    </section>
  );
}
