import { Zap } from "lucide-react";

interface InstanceBadgeProps {
  instanceId: string | null;
  status: "connecting" | "connected" | "disconnected";
}

export function InstanceBadge({ instanceId, status }: InstanceBadgeProps) {
  const isInstance2 = instanceId?.includes("2");

  return (
    <div className={`instance-badge instance-badge--${status}`}>
      <span className="instance-badge__dot" />
      <span className="instance-badge__text" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
        {status === "connected" && instanceId ? (
          <>
            <Zap size={12} color="var(--accent-cyan)" /> {instanceId}
          </>
        ) : status === "connecting" ? (
          "Connecting..."
        ) : (
          "Disconnected"
        )}
      </span>
      {status === "connected" && instanceId && (
        <span className={`instance-badge__node instance-badge__node--${isInstance2 ? "2" : "1"}`}>
          Node {isInstance2 ? "2" : "1"}
        </span>
      )}
    </div>
  );
}
