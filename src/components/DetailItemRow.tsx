import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { DetailItem, PlannerStatus } from "../model/types";
import { StatusBadge } from "./StatusBadge";

const statusOptions: { value: PlannerStatus; label: string }[] = [
  { value: "waiting", label: "대기" },
  { value: "in_progress", label: "진행중" },
  { value: "done", label: "완료" }
];

export function DetailItemRow({
  item,
  onStatusChange,
  onTitleChange,
  onRemove
}: {
  item: DetailItem;
  onStatusChange(itemId: string, status: PlannerStatus): void;
  onTitleChange(itemId: string, title: string): void;
  onRemove(itemId: string): void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const canSave = draftTitle.trim().length > 0;

  const beginEdit = () => {
    setDraftTitle(item.title);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftTitle(item.title);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return;
    onTitleChange(item.id, nextTitle);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} className="detail-row" style={style}>
      <button className="drag-handle" type="button" aria-label={`${item.title} 세부 항목 순서 변경`} {...attributes} {...listeners}>
        <GripVertical className="drag-icon" size={20} aria-hidden />
      </button>
      {isEditing ? (
        <label className="detail-edit-field">
          <span>{item.title} 제목 수정</span>
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEdit();
              if (event.key === "Escape") cancelEdit();
            }}
          />
        </label>
      ) : (
        <strong>{item.title}</strong>
      )}
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
      <div className="detail-row__actions">
        {isEditing ? (
          <>
            <button className="icon-button icon-button--green" type="button" onClick={saveEdit} disabled={!canSave}>
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
            <button className="icon-button icon-button--ghost" type="button" onClick={beginEdit}>
              <Pencil size={18} aria-hidden />
              <span className="sr-only">{item.title} 수정</span>
            </button>
            <button className="icon-button icon-button--danger" type="button" onClick={() => onRemove(item.id)}>
              <Trash2 size={18} aria-hidden />
              <span className="sr-only">{item.title} 삭제</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
