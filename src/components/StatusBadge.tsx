import type { PlannerStatus } from "../model/types";

const labels: Record<PlannerStatus, string> = {
  waiting: "대기",
  in_progress: "진행중",
  done: "완료"
};

export function StatusBadge({ status }: { status: PlannerStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>;
}
