export type TargetClass = "infantry" | "truck";

export type Target = {
  id: string;
  cls: TargetClass;
  confidence: number;
  /** ground position in metres, X east / Z south */
  x: number;
  z: number;
  heading: number;
  /** normalised bounding box in the video frame (0..1) */
  bbox: { x: number; y: number; w: number; h: number };
  lat: number;
  lon: number;
  lastSeen: number;
};

export type Drone = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  battery: number;
  lat: number;
  lon: number;
};

export type FeedFrame = {
  t: number;
  drone: Drone;
  targets: Target[];
};

export type FeedStatus = "connecting" | "live" | "simulated";

const ORIGIN = { lat: 34.5553, lon: 69.2075 };

export function toGeo(x: number, z: number) {
  return {
    lat: ORIGIN.lat - z / 111_320,
    lon: ORIGIN.lon + x / (111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180)),
  };
}

export function formatCoord(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}°${ns} ${Math.abs(lon).toFixed(5)}°${ew}`;
}

/* ---------------------------------------------------------------- sim ----- */

type SimTarget = {
  id: string;
  cls: TargetClass;
  x: number;
  z: number;
  vx: number;
  vz: number;
};

function seedTargets(): SimTarget[] {
  const out: SimTarget[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    out.push({
      id: `INF-${(i + 1).toString().padStart(2, "0")}`,
      cls: "infantry",
      x: Math.cos(a) * (14 + i * 3),
      z: Math.sin(a) * (10 + i * 2),
      vx: (Math.random() - 0.5) * 1.6,
      vz: (Math.random() - 0.5) * 1.6,
    });
  }
  for (let i = 0; i < 3; i++) {
    out.push({
      id: `VEH-${(i + 1).toString().padStart(2, "0")}`,
      cls: "truck",
      x: -34 + i * 13,
      z: 24 - i * 2,
      vx: 3.4,
      vz: -0.25,
    });
  }
  return out;
}

export function createSimulator() {
  const sim = seedTargets();
  const start = Date.now();

  return function step(dt: number): FeedFrame {
    const t = (Date.now() - start) / 1000;

    for (const s of sim) {
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      if (s.cls === "infantry") {
        s.vx += (Math.random() - 0.5) * 0.5;
        s.vz += (Math.random() - 0.5) * 0.5;
        s.vx = Math.max(-2, Math.min(2, s.vx));
        s.vz = Math.max(-2, Math.min(2, s.vz));
      }
      if (s.x > 42) s.x = -42;
      if (s.x < -42) s.x = 42;
      if (s.z > 42) s.z = -42;
      if (s.z < -42) s.z = 42;
    }

    const drone: Drone = {
      x: Math.cos(t * 0.12) * 18,
      y: 26 + Math.sin(t * 0.4) * 1.5,
      z: Math.sin(t * 0.12) * 18,
      yaw: t * 0.12 + Math.PI / 2,
      battery: Math.max(24, 92 - t * 0.08),
      ...toGeo(Math.cos(t * 0.12) * 18, Math.sin(t * 0.12) * 18),
    };

    const targets: Target[] = sim.map((s, i) => {
      const bw = s.cls === "truck" ? 0.16 : 0.06;
      const bh = s.cls === "truck" ? 0.12 : 0.16;
      const bx = Math.min(0.9, Math.max(0.02, 0.5 + (s.x - drone.x) / 110));
      const by = Math.min(0.86, Math.max(0.06, 0.5 + (s.z - drone.z) / 130));
      return {
        id: s.id,
        cls: s.cls,
        confidence: 0.72 + ((Math.sin(t * 1.3 + i) + 1) / 2) * 0.26,
        x: s.x,
        z: s.z,
        heading: Math.atan2(s.vx, s.vz),
        bbox: { x: bx, y: by, w: bw, h: bh },
        ...toGeo(s.x, s.z),
        lastSeen: Date.now(),
      };
    });

    return { t: Date.now(), drone, targets };
  };
}
