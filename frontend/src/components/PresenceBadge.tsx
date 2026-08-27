import { Users } from "lucide-react";

interface PresenceBadgeProps {
  count: number;
}

export function PresenceBadge({ count }: PresenceBadgeProps) {
  return (
    <div className="presence-badge">
      <Users size={12} color="var(--accent-cyan)" />
      <span>{count} {count === 1 ? "person" : "people"} watching</span>
    </div>
  );
}
