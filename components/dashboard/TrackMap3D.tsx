"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { TrackPoint } from "@/lib/openf1";

// 3D circuit ribbon built from real car-location samples of the fastest lap.
// The whole group idles in a slow rotation and leans toward the pointer; a
// glowing "car" runs the lap on repeat.

function Scene({ points, accent }: { points: TrackPoint[]; accent: string }) {
  const group = useRef<THREE.Group>(null);
  const car = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.PointLight>(null);

  const { curve, tube, start } = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(p.x * 3.4, p.y * 3.4, p.z * 3.4));
    const curve = new THREE.CatmullRomCurve3(vecs, true, "centripetal", 0.5);
    const tube = new THREE.TubeGeometry(curve, 480, 0.028, 10, true);
    return { curve, tube, start: curve.getPointAt(0) };
  }, [points]);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.12 + pointer.x * 0.35;
      const targetX = -0.12 + pointer.y * -0.18;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.06;
    }
    const u = (t * 0.055) % 1;
    const pos = curve.getPointAt(u);
    if (car.current) car.current.position.copy(pos);
    if (trail.current) trail.current.position.copy(pos);
  });

  return (
    <group ref={group} rotation={[-0.12, 0, 0]}>
      <mesh geometry={tube}>
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      {/* Start/finish beacon */}
      <mesh position={start}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* The lapping car */}
      <mesh ref={car}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight ref={trail} color={accent} intensity={2.4} distance={1.6} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
    </group>
  );
}

export default function TrackMap3D({ points, accent }: { points: TrackPoint[]; accent: string }) {
  if (points.length < 8) return null;
  return (
    <Canvas
      className="trackmap-canvas"
      camera={{ position: [0, 1.7, 3.1], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene points={points} accent={accent} />
    </Canvas>
  );
}
