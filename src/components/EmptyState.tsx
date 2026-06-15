export function EmptyState({ title, action }: { title: string; action?: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {action ? <span>{action}</span> : null}
    </div>
  );
}
