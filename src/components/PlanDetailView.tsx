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
import { ArrowLeft, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import type { DailyPlanEntry, LargePlan, PlannerStatus } from "../model/types";
import { DetailItemRow } from "./DetailItemRow";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

const statusOptions: { value: PlannerStatus; label: string }[] = [
  { value: "waiting", label: "대기" },
  { value: "in_progress", label: "진행중" },
  { value: "done", label: "완료" }
];

export type PlanDetailViewProps = {
  date: string;
  entry: DailyPlanEntry;
  plan: LargePlan;
  onBack(): void;
  onAddDetailItem(entryId: string, title: string): void;
  onEntryStatusChange(entryId: string, status: PlannerStatus): void;
  onDetailItemStatusChange(entryId: string, itemId: string, status: PlannerStatus): void;
  onReorderDetailItems(activeId: string, overId: string): void;
};

export function PlanDetailView({
  date,
  entry,
  plan,
  onBack,
  onAddDetailItem,
  onEntryStatusChange,
  onDetailItemStatusChange,
  onReorderDetailItems
}: PlanDetailViewProps) {
  const [detailTitle, setDetailTitle] = useState("");
  const canSubmitDetail = detailTitle.trim().length > 0;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = detailTitle.trim();
    if (!trimmedTitle) return;
    onAddDetailItem(entry.id, trimmedTitle);
    setDetailTitle("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderDetailItems(String(active.id), String(over.id));
  };

  return (
    <section className="planner-panel planner-panel--main" aria-labelledby="detail-title">
      <button className="button button--ghost back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden />
        선택 날짜 계획
      </button>

      <div className="panel-heading panel-heading--detail">
        <div>
          <span className="eyebrow">{date}</span>
          <h1 id="detail-title">{plan.title}</h1>
        </div>
        <div className="status-control">
          <StatusBadge status={entry.status} />
          <label>
            <span>계획 상태</span>
            <select
              className="status-select"
              value={entry.status}
              onChange={(event) => onEntryStatusChange(entry.id, event.target.value as PlannerStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form className="add-detail-form" onSubmit={handleSubmit}>
        <label htmlFor="detail-item-title">세부 항목</label>
        <div className="input-row">
          <input
            id="detail-item-title"
            type="text"
            value={detailTitle}
            onChange={(event) => setDetailTitle(event.target.value)}
            placeholder="예: 1강 듣기"
          />
          <button className="icon-button" type="submit" aria-label="세부 항목 추가" disabled={!canSubmitDetail}>
            <Plus size={20} aria-hidden />
          </button>
        </div>
      </form>

      {entry.detailItems.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={entry.detailItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="detail-list">
              {entry.detailItems.map((item) => (
                <DetailItemRow
                  key={item.id}
                  item={item}
                  onStatusChange={(itemId, status) => onDetailItemStatusChange(entry.id, itemId, status)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="detail-list">
          <EmptyState title="세부 항목이 없습니다" action="이 계획을 실행할 작은 단계를 추가해 보세요." />
        </div>
      )}
    </section>
  );
}
