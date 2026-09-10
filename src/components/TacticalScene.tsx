import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Html, OrbitControls, Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FeedFrame, Target } from "@/lib/tactical";

const HOSTILE = "#e8442e";
const VEHICLE = "#f5a524";
const PHOSPHOR = "#4ade80";

function DroneRig({ frame }: { frame: FeedFrame | null }) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(0, 24, 0), []);

  useFrame((_, delta) => {
    if (!group.current || !frame) return;
    target.set(frame.drone.x, frame.drone.y, frame.drone.z);
    group.current.position.lerp(target, 1 - Math.exp(-6 * delta));
    group.current.rotation.y = frame.drone.yaw;
  });

  return (
    <group ref={group} position={[0, 24, 0]}>
      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.5, 2.4]} />
        <meshStandardMaterial color="#1d2b22" emissive={PHOSPHOR} emissiveIntensity={0.18} />
      </mesh>
      {/* rotor arms */}
      {[
        [-1.4, 0, -1.4],
        [1.4, 0, -1.4],
        [-1.4, 0, 1.4],
        [1.4, 0, 1.4],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.75, 0.75, 0.06, 20]} />
            <meshStandardMaterial
              color={PHOSPHOR}
              emissive={PHOSPHOR}
              emissiveIntensity={0.7}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}
      {/* sensor frustum */}
      <mesh position={[0, -12, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[13, 24, 4, 1, true]} />
        <meshBasicMaterial
          color={PHOSPHOR}
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -12, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[13, 24, 4, 1, true]} />
        <meshBasicMaterial color={PHOSPHOR} wireframe transparent opacity={0.35} />
      </mesh>
      <pointLight color={PHOSPHOR} intensity={22} distance={40} />
      <Html center distanceFactor={60} position={[0, 3, 0]}>
        <div className="whitespace-nowrap border border-primary/60 bg-background/80 px-1.5 py-0.5 text-[9px] tracking-widest text-primary">
          UAV-01
        </div>
      </Html>
    </group>
  );
}

function TargetPin({ target }: { target: Target }) {
  const group = useRef<THREE.Group>(null);
  const dest = useMemo(() => new THREE.Vector3(target.x, 0, target.z), [target.x, target.z]);
  const hostile = target.cls === "infantry";
  const color = hostile ? HOSTILE : VEHICLE;

  useFrame((state, delta) => {
    if (!group.current) return;
    dest.set(target.x, 0, target.z);
    group.current.position.lerp(dest, 1 - Math.exp(-5 * delta));
    const ring = group.current.children[0] as THREE.Mesh | undefined;
    if (ring) {
      const s = 1 + ((state.clock.elapsedTime * 0.8) % 1) * 1.6;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((s - 1) / 1.6));
    }
  });

  return (
    <group ref={group} position={[target.x, 0, target.z]}>
      {/* pulsing ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.4, 1.7, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {hostile ? (
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.8, 18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      ) : (
        <mesh position={[0, 0.8, 0]} rotation={[0, target.heading, 0]} castShadow>
          <boxGeometry args={[1.6, 1.5, 3.4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      )}

      {/* vertical beacon */}
      <Line
        points={[
          [0, 0, 0],
          [0, hostile ? 7 : 6, 0],
        ]}
        color={color}
        transparent
        opacity={0.45}
        lineWidth={1}
      />
      <Html center distanceFactor={70} position={[0, hostile ? 8 : 7, 0]}>
        <div
          className="whitespace-nowrap border px-1.5 py-0.5 text-[9px] font-bold tracking-widest"
          style={{ color, borderColor: color, background: "rgba(4,20,12,0.8)" }}
        >
          {target.id} · {(target.confidence * 100).toFixed(0)}%
        </div>
      </Html>
    </group>
  );
}

function SceneContents({ frame }: { frame: FeedFrame | null }) {
  return (
    <>
      <color attach="background" args={["#050d0a"]} />
      <fog attach="fog" args={["#050d0a", 60, 190]} />
      <ambientLight intensity={0.35} color="#7fd8a5" />
      <hemisphereLight args={["#2f6b4a", "#04120b", 0.5]} />
      <directionalLight position={[30, 45, 20]} intensity={0.7} color="#bff3d4" castShadow />

      <Grid
        args={[220, 220]}
        cellSize={5}
        cellThickness={0.6}
        cellColor="#1f5c3d"
        sectionSize={25}
        sectionThickness={1.1}
        sectionColor="#3ddc84"
        fadeDistance={200}
        fadeStrength={1.4}
        infiniteGrid
        position={[0, 0.01, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#08170f" roughness={0.95} metalness={0.05} />
      </mesh>

      <DroneRig frame={frame} />
      {(frame?.targets ?? []).map((t) => (
        <TargetPin key={t.id} target={t} />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={18}
        maxDistance={190}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 4, 0]}
      />
    </>
  );
}

export function TacticalScene({ frame }: { frame: FeedFrame | null }) {
  return (
    <Canvas shadows camera={{ position: [46, 40, 56], fov: 50 }} dpr={[1, 1.8]}>
      <SceneContents frame={frame} />
    </Canvas>
  );
}
