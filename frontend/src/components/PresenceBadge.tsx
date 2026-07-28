interface PresenceBadgeProps {
  count: number;
}

export function PresenceBadge({ count }: PresenceBadgeProps) {
  return (
    <div className="presence-badge">
      <span className="presence-dot" />
      <span>{count} {count === 1 ? "person" : "people"} watching</span>
    </div>
  );
}
