import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  RoundedBox,
} from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { cn } from "@/lib/utils";

function BloodBag({ bloodType, change, children }) {
  const bagRef = useRef(null);
  const liquidRef = useRef(null);

  <mesh ref={bagRef} position={[0, 0, 0]}>
    <boxGeometry args={[1, 2, 1]} />
    <meshStandardMaterial color="red" />
  </mesh>;

  // Subtle floating animation
  useFrame((state) => {
    if (bagRef.current) {
      bagRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      bagRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
  });

  // Determine blood color based on type
  const colors = {
    "A+": "#dc2626",
    "A-": "#ef4444",
    "B+": "#be123c",
    "B-": "#e11d48",
    "AB+": "#991b1b",
    "AB-": "#b91c1c",
    "O+": "#dc2626",
    "O-": "#f87171",
  };
  const bloodColor = colors[bloodType] || "#dc2626";

  return (
    <group ref={bagRef}>
      {/* Blood Bag Container - Translucent plastic */}
      <group position={[0, 0, 0]}>
        <RoundedBox
          args={[2.2, 3.2, 0.6]}
          radius={0.3}
          smoothness={4}
          castShadow
        >
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            roughness={0.2}
            metalness={0.1}
            transmission={0.95}
            thickness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>
      </group>

      {/* Blood Liquid Inside - 85% filled with organic shape */}
      <group position={[0, -0.2, 0]}>
        <RoundedBox args={[2.0, 2.7, 0.45]} radius={0.25} smoothness={4}>
          <meshStandardMaterial
            color={bloodColor}
            roughness={0.4}
            metalness={0.1}
            emissive={bloodColor}
            emissiveIntensity={0.2}
          />
        </RoundedBox>
      </group>

      {/* Top Ports/Tubing System - More detailed */}
      <group position={[0, 1.8, 0]}>
        {/* Main Connector */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>

        {/* Side tubes simulating IV ports */}
        <mesh position={[-0.5, -0.1, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.6} />
        </mesh>

        {/* Top Tube Loop */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.5} />
        </mesh>
      </group>

      {children && (
        <Html
          transform
          occlude={[bagRef]}
          position={[0, 0.23, 0.4]}
          scale={0.28}
          style={{
            width: "200px",
            height: "300px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {children}
        </Html>
      )}
    </group>
  );
}

export default function BloodBag3D({ bloodType, change, className, children }) {
  return (
    <div
      className={cn(
        "relative w-full rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900",
        className ? className : "h-48"
      )}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#ff9999" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        {/* Blood Bag Model - passing children down */}
        <BloodBag bloodType={bloodType} change={change}>
          {children}
        </BloodBag>
      </Canvas>

      {/* Blood Type Label Overlay - Only show if no children (preview mode) */}
      {!children && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-2 shadow-xl">
              <p className="text-3xl font-bold text-red-700">{bloodType}</p>
            </div>
          </div>

          {/* Change Badge Overlay */}
          {change !== 0 && (
            <div className="absolute top-3 right-3">
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-md ${
                  change > 0
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
