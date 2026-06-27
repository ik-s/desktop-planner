import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { DailyPlanEntry, LargePlan } from "../model/types";
import { StatusBadge } from "./StatusBadge";

export function LargePlanCard({
  entry,
  plan,
  onOpen,
  onRemove
}: {
  entry: DailyPlanEntry;
  plan: LargePlan;
  onOpen(): void;
  onRemove(): void;
}) {
  const previewItems = entry.detailItems.slice(0, 2);
  const hiddenCount = Math.max(entry.detailItems.length - previewItems.length, 0);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} className="large-plan-card" style={style}>
      <button className="drag-handle" type="button" aria-label={`${plan.title} 순서 변경`} {...attributes} {...listeners}>
        <GripVertical className="drag-icon" size={20} aria-hidden />
      </button>
      <button className="large-plan-card__open" type="button" onClick={onOpen}>
        <div className="large-plan-card__content">
          <strong>{plan.title}</strong>
          <div className="detail-preview">
            {previewItems.map((item) => (
              <span key={item.id}>{item.title}</span>
            ))}
            {hiddenCount > 0 ? <span>+{hiddenCount}</span> : null}
          </div>
        </div>
        <StatusBadge status={entry.status} />
      </button>
      <button className="icon-button icon-button--danger large-plan-card__delete" type="button" onClick={onRemove}>
        <Trash2 size={18} aria-hidden />
        <span className="sr-only">{plan.title} 삭제</span>
      </button>
    </div>
  );
}
