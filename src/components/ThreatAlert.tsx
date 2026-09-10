import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { FeedFrame } from "@/lib/tactical";

export function ThreatAlert({ frame }: { frame: FeedFrame | null }) {
  const targets = frame?.targets ?? [];
  const hostiles = targets.filter((t) => t.cls === "infantry");
  const vehicles = targets.filter((t) => t.cls === "truck");
  const threat = hostiles.length > 0;

  const nearest = targets.reduce<number | null>((acc, t) => {
    if (!frame) return acc;
    const d = Math.hypot(t.x - frame.drone.x, t.z - frame.drone.z);
    return acc === null || d < acc ? d : acc;
  }, null);

  return (
    <div
      className={`panel flex items-center gap-4 px-4 py-3 ${
        threat ? "animate-threat-pulse border-hostile/80 bg-hostile/10" : "border-primary/40"
      }`}
      role="status"
      aria-live="assertive"
    >
      {threat ? (
        <AlertTriangle className="size-7 shrink-0 text-hostile" />
      ) : (
        <ShieldCheck className="size-7 shrink-0 text-primary" />
      )}
      <div className="min-w-0 flex-1">
        <h2 className={`text-lg leading-none ${threat ? "text-hostile" : "text-primary"}`}>
          {threat ? "Threat Detected" : "Sector Clear"}
        </h2>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {threat
            ? `${hostiles.length} hostile infantry · ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} · nearest ${nearest ? nearest.toFixed(0) : "--"} m`
            : "No hostile signatures in current field of view"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-right">
        <div>
          <div className="label-hud">Infantry</div>
          <div className="font-mono text-xl text-hostile">
            {hostiles.length.toString().padStart(2, "0")}
          </div>
        </div>
        <div>
          <div className="label-hud">Vehicles</div>
          <div className="font-mono text-xl text-vehicle">
            {vehicles.length.toString().padStart(2, "0")}
          </div>
        </div>
      </div>
    </div>
  );
}
