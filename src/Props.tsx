import { useMemo } from "react";
import { Vector2 } from "three";
import type { PropType } from "./config";

function Book({
  x,
  height,
  color,
  lean = 0,
}: {
  x: number;
  height: number;
  color: string;
  lean?: number;
}) {
  return (
    <group position={[x, 0.004, 0.025]} rotation={[0, 0, lean]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[0.032, height, 0.18]} />
        <meshStandardMaterial color="#ddd7c7" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.018, height / 2, 0]} castShadow>
          <boxGeometry args={[0.003, height + 0.006, 0.19]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, height / 2, 0.094]} castShadow>
        <boxGeometry args={[0.038, height + 0.006, 0.005]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[0.025, height - 0.028].map((y) => (
        <mesh key={y} position={[0, y, 0.098]}>
          <boxGeometry args={[0.026, 0.002, 0.001]} />
          <meshStandardMaterial
            color="#b8ac8c"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function Vessel({
  color,
  planter = false,
}: {
  color: string;
  planter?: boolean;
}) {
  const profile = useMemo(
    () =>
      (planter
        ? [
            [0.045, 0],
            [0.048, 0.005],
            [0.066, 0.112],
            [0.067, 0.12],
            [0.061, 0.12],
            [0.058, 0.108],
            [0.046, 0.012],
            [0, 0.012],
          ]
        : [
            [0.038, 0],
            [0.042, 0.005],
            [0.064, 0.018],
            [0.083, 0.068],
            [0.084, 0.1],
            [0.071, 0.14],
            [0.044, 0.18],
            [0.035, 0.208],
            [0.035, 0.238],
            [0.03, 0.24],
            [0.026, 0.234],
            [0.028, 0.206],
            [0.037, 0.176],
            [0.063, 0.134],
            [0.075, 0.098],
            [0.073, 0.069],
            [0.051, 0.025],
            [0.032, 0.014],
            [0, 0.014],
          ]
      ).map(([x, y]) => new Vector2(x, y)),
    [planter],
  );
  return (
    <mesh castShadow receiveShadow>
      <latheGeometry args={[profile, 64]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}

function Plant({ color }: { color: string }) {
  return (
    <group>
      <Vessel color={color} planter />
      <mesh position={[0, 0.109, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 32]} />
        <meshStandardMaterial color="#3d3024" roughness={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const angle = i * 2.4,
          tilt = 0.4 + (i % 3) * 0.15,
          length = 0.12 + (i % 4) * 0.025;
        return (
          <group
            key={i}
            position={[Math.cos(angle) * 0.012, 0.115, Math.sin(angle) * 0.012]}
            rotation={[Math.cos(angle) * tilt, angle, Math.sin(angle) * tilt]}
          >
            <mesh position={[0, length / 2, 0]} castShadow>
              <cylinderGeometry args={[0.0012, 0.0018, length, 8]} />
              <meshStandardMaterial color="#526a35" roughness={0.9} />
            </mesh>
            <mesh
              position={[0, length * 0.78, 0]}
              scale={[0.022, 0.058, 0.005]}
              rotation={[0.12, 0, 0.2]}
              castShadow
            >
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial
                color={i % 2 ? "#52643b" : "#748b48"}
                roughness={0.8}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function Prop({
  type,
  color,
}: {
  type: PropType;
  color: string;
}) {
  if (type === "books")
    return (
      <group position={[-0.1125, 0, 0]}>
        <Book x={-0.05} height={0.24} color={color} />
        <Book x={-0.006} height={0.215} color="#a2a08a" />
        <Book x={0.04} height={0.255} color="#484c44" />
        <Book x={0.11} height={0.2} color="#c2b69a" lean={0.14} />
      </group>
    );
  if (type === "vase") return <Vessel color={color} />;
  if (type === "plant") return <Plant color={color} />;
  return (
    <group>
      <mesh position={[0, 0.065, 0]} castShadow>
        <boxGeometry args={[0.29, 0.13, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.132, 0]} castShadow>
        <boxGeometry args={[0.298, 0.008, 0.258]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.082, 0.127]}>
        <boxGeometry args={[0.055, 0.025, 0.003]} />
        <meshStandardMaterial
          color="#c3b99b"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.082, 0.13]}>
        <boxGeometry args={[0.037, 0.013, 0.002]} />
        <meshStandardMaterial color="#e5dece" roughness={0.9} />
      </mesh>
    </group>
  );
}
