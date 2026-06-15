import { GripVertical } from "lucide-react";
import type { DetailItem } from "../model/types";
import { StatusBadge } from "./StatusBadge";

export function DetailItemRow({ item }: { item: DetailItem }) {
  return (
    <div className="detail-row">
      <GripVertical className="drag-icon" size={20} aria-hidden />
      <strong>{item.title}</strong>
      <StatusBadge status={item.status} />
    </div>
  );
}
