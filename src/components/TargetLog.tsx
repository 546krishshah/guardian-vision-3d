import { useEffect, useRef, useState } from "react";
import { formatCoord, type FeedFrame, type TargetClass } from "@/lib/tactical";

type LogEntry = {
  key: number;
  time: string;
  id: string;
  cls: TargetClass;
  coord: string;
  confidence: number;
  range: number;
};

export function TargetLog({ frame }: { frame: FeedFrame | null }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const lastRef = useRef(0);
  const counter = useRef(0);

  useEffect(() => {
    if (!frame) return;
    const now = Date.now();
    if (now - lastRef.current < 900) return;
    lastRef.current = now;
    const stamp = new Date(now).toISOString().slice(11, 19) + "Z";
    const fresh: LogEntry[] = frame.targets.map((t) => ({
      key: ++counter.current,
      time: stamp,
      id: t.id,
      cls: t.cls,
      coord: formatCoord(t.lat, t.lon),
      confidence: t.confidence,
      range: Math.hypot(t.x - frame.drone.x, t.z - frame.drone.z),
    }));
    setEntries((prev) => [...fresh.reverse(), ...prev].slice(0, 80));
  }, [frame]);

  return (
    <div className="panel flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm text-primary">Target Coordinate Log</h3>
        <span className="label-hud">{entries.length} entries</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-card">
            <tr className="text-left">
              <th className="label-hud px-3 py-1.5 font-semibold">Time</th>
              <th className="label-hud px-2 py-1.5 font-semibold">ID</th>
              <th className="label-hud px-2 py-1.5 font-semibold">Class</th>
              <th className="label-hud px-2 py-1.5 font-semibold">Grid</th>
              <th className="label-hud px-2 py-1.5 text-right font-semibold">Rng</th>
              <th className="label-hud px-3 py-1.5 text-right font-semibold">Conf</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.key} className="border-t border-border/50">
                <td className="px-3 py-1 text-muted-foreground">{e.time}</td>
                <td
                  className={`px-2 py-1 font-bold ${e.cls === "infantry" ? "text-hostile" : "text-vehicle"}`}
                >
                  {e.id}
                </td>
                <td className="px-2 py-1 text-muted-foreground">
                  {e.cls === "infantry" ? "INFANTRY" : "TRUCK"}
                </td>
                <td className="px-2 py-1">{e.coord}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">
                  {e.range.toFixed(0)}m
                </td>
                <td className="px-3 py-1 text-right">{(e.confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Awaiting detections…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
