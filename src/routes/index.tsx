import { createFileRoute } from "@tanstack/react-router";
import { Radio, Battery, Crosshair, Satellite } from "lucide-react";
import { TacticalScene } from "@/components/TacticalScene";
import { VideoFeedPane } from "@/components/VideoFeedPane";
import { ThreatAlert } from "@/components/ThreatAlert";
import { TargetLog } from "@/components/TargetLog";
import { useTacticalFeed } from "@/lib/useTacticalFeed";
import { formatCoord } from "@/lib/tactical";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "DRONE — UAV Tactical Command Deck" },
      {
        name: "description",
        content:
          "Dual-pane UAV command dashboard: live detection feed with bounding boxes and an interactive 3D battlespace with hostile infantry and vehicle tracks.",
      },
      { property: "og:title", content: "DRONE — UAV Tactical Command Deck" },
      {
        property: "og:description",
        content:
          "Real-time drone ISR dashboard with 2D detection overlay, 3D target pins and threat alerting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandDeck,
});

function CommandDeck() {
  const { frame, status } = useTacticalFeed();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/70 px-4 py-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl text-primary">DRONE</h1>
          <span className="label-hud">UAV Tactical Command Deck</span>
        </div>
        <div className="flex items-center gap-5 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5 text-primary" />
            <span
              className={
                status === "live" ? "text-primary" : status === "connecting" ? "text-vehicle" : "text-muted-foreground"
              }
            >
              {status === "live"
                ? "LINK LIVE"
                : status === "connecting"
                  ? "LINK SYNC…"
                  : "SIM TELEMETRY"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Satellite className="size-3.5" />
            {frame ? formatCoord(frame.drone.lat, frame.drone.lon) : "ACQUIRING FIX"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Battery className="size-3.5" />
            {frame ? frame.drone.battery.toFixed(0) : "--"}%
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left 40% — sensor feed */}
        <section className="flex min-h-0 basis-2/5 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-3 py-1.5">
            <h2 className="text-sm text-primary">Sensor Feed · CAM-01</h2>
            <span className="label-hud">2D Detection Overlay</span>
          </div>
          <div className="relative min-h-[280px] flex-1">
            <VideoFeedPane frame={frame} />
          </div>
          <div className="shrink-0 border-t border-border p-2">
            <ThreatAlert frame={frame} />
          </div>
        </section>

        {/* right 60% — 3D battlespace */}
        <section className="flex min-h-0 basis-3/5 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-3 py-1.5">
            <h2 className="flex items-center gap-2 text-sm text-primary">
              <Crosshair className="size-4" /> Battlespace · 3D
            </h2>
            <div className="flex items-center gap-4 text-[10px] tracking-widest">
              <span className="flex items-center gap-1.5 text-hostile">
                <span className="inline-block h-3 w-2 rounded-sm bg-hostile" /> INFANTRY
              </span>
              <span className="flex items-center gap-1.5 text-vehicle">
                <span className="inline-block h-2.5 w-3.5 bg-vehicle" /> TRUCK / CONVOY
              </span>
              <span className="text-muted-foreground">DRAG TO ORBIT · SCROLL TO ZOOM</span>
            </div>
          </div>
          <div className="relative min-h-[320px] flex-[1.6]">
            <TacticalScene frame={frame} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <TargetLog frame={frame} />
          </div>
        </section>
      </main>
    </div>
  );
}
