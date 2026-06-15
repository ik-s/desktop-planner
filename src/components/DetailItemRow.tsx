import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { DetailItem, PlannerStatus } from "../model/types";
import { StatusBadge } from "./StatusBadge";

const statusOptions: { value: PlannerStatus; label: string }[] = [
  { value: "waiting", label: "대기" },
  { value: "in_progress", label: "진행중" },
  { value: "done", label: "완료" }
];

export function DetailItemRow({
  item,
  onStatusChange
}: {
  item: DetailItem;
  onStatusChange(itemId: string, status: PlannerStatus): void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} className="detail-row" style={style}>
      <button className="drag-handle" type="button" aria-label={`${item.title} 세부 항목 순서 변경`} {...attributes} {...listeners}>
        <GripVertical className="drag-icon" size={20} aria-hidden />
      </button>
      <strong>{item.title}</strong>
      <StatusBadge status={item.status} />
      <select
        className="status-select"
        aria-label={`${item.title} 상태`}
        value={item.status}
        onChange={(event) => onStatusChange(item.id, event.target.value as PlannerStatus)}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
