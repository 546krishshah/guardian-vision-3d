import { useEffect, useRef, useState } from "react";
import { createSimulator, type FeedFrame, type FeedStatus } from "./tactical";

const WS_URL = import.meta.env["VITE_TACTICAL_WS_URL"] as string | undefined;

/**
 * Subscribes to the detection service over WebSocket when one is configured,
 * otherwise drives the dashboard from a local simulator so the operator view
 * is always populated.
 */
export function useTacticalFeed() {
  const [frame, setFrame] = useState<FeedFrame | null>(null);
  const [status, setStatus] = useState<FeedStatus>(WS_URL ? "connecting" : "simulated");
  const simRef = useRef(createSimulator());

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let socket: WebSocket | null = null;
    let live = false;

    if (WS_URL) {
      try {
        socket = new WebSocket(WS_URL);
        socket.onopen = () => {
          live = true;
          setStatus("live");
        };
        socket.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data as string) as FeedFrame;
            if (data && data.drone && Array.isArray(data.targets)) setFrame(data);
          } catch {
            /* ignore malformed frames */
          }
        };
        socket.onerror = () => {
          live = false;
          setStatus("simulated");
        };
        socket.onclose = () => {
          live = false;
          setStatus("simulated");
        };
      } catch {
        setStatus("simulated");
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!live) setFrame(simRef.current(dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      socket?.close();
    };
  }, []);

  return { frame, status };
}
