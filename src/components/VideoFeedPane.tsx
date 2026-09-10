import { useEffect, useRef } from "react";
import type { FeedFrame } from "@/lib/tactical";

/**
 * Raw sensor feed. When a real stream is configured we show it, otherwise a
 * synthetic night-vision frame stands in so the overlay geometry is visible.
 */
const STREAM_URL = import.meta.env["VITE_TACTICAL_STREAM_URL"] as string | undefined;

function SyntheticFeed() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let raf = 0;
    const draw = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.fillStyle = "#04140c";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(90, 220, 140, 0.14)";
      ctx.lineWidth = 1;
      const off = (t * 0.02) % 40;
      for (let y = -40 + off; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 0; i < 26; i++) {
        const bx = ((i * 137 + t * 0.03) % w) | 0;
        const by = ((i * 211) % h) | 0;
        const r = 14 + ((i * 7) % 30);
        ctx.fillStyle = `rgba(70, 170, 110, ${0.05 + (i % 5) * 0.015})`;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const img = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 26;
        img.data[i] = Math.max(0, (img.data[i] ?? 0) + n * 0.4);
        img.data[i + 1] = Math.max(0, (img.data[i + 1] ?? 0) + n);
        img.data[i + 2] = Math.max(0, (img.data[i + 2] ?? 0) + n * 0.4);
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} width={640} height={400} className="h-full w-full object-cover" />;
}

export function VideoFeedPane({ frame }: { frame: FeedFrame | null }) {
  const targets = frame?.targets ?? [];

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {STREAM_URL ? (
        <img src={STREAM_URL} alt="Live UAV sensor feed" className="h-full w-full object-cover" />
      ) : (
        <SyntheticFeed />
      )}

      {/* scanline + vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 h-6 bg-scan/10 blur-sm animate-scanline" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.75)]" />
      </div>

      {/* bounding boxes */}
      <div className="pointer-events-none absolute inset-0">
        {targets.map((t) => {
          const hostile = t.cls === "infantry";
          return (
            <div
              key={t.id}
              className={`absolute border-2 ${hostile ? "border-hostile" : "border-vehicle"}`}
              style={{
                left: `${t.bbox.x * 100}%`,
                top: `${t.bbox.y * 100}%`,
                width: `${t.bbox.w * 100}%`,
                height: `${t.bbox.h * 100}%`,
                transition: "all 120ms linear",
              }}
            >
              <span
                className={`absolute -top-5 left-0 whitespace-nowrap px-1 text-[10px] font-bold tracking-wider ${
                  hostile
                    ? "bg-hostile text-destructive-foreground"
                    : "bg-vehicle text-accent-foreground"
                }`}
              >
                {t.id} {(t.confidence * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* reticle + hud corners */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 border border-scan/50" />
        <div className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 bg-scan/40" />
        <div className="absolute left-1/2 top-1/2 h-24 w-px -translate-y-1/2 bg-scan/40" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 text-[11px] text-primary">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-hostile" /> REC · EO/IR CAM-01
        </span>
        <span>DETECTIONS {targets.length.toString().padStart(2, "0")}</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-[11px] text-muted-foreground">
        <span>ALT {frame ? frame.drone.y.toFixed(1) : "--"} M</span>
        <span>YOLO-V8 / 30 FPS</span>
      </div>
    </div>
  );
}
