import { GripVertical } from "lucide-react";
import type { DailyPlanEntry, LargePlan } from "../model/types";
import { StatusBadge } from "./StatusBadge";

export function LargePlanCard({ entry, plan, onOpen }: { entry: DailyPlanEntry; plan: LargePlan; onOpen(): void }) {
  const previewItems = entry.detailItems.slice(0, 2);
  const hiddenCount = Math.max(entry.detailItems.length - previewItems.length, 0);

  return (
    <button className="large-plan-card" type="button" onClick={onOpen}>
      <GripVertical className="drag-icon" size={20} aria-hidden />
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
  );
}
