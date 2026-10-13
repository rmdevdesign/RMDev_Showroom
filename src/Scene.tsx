import {
  Component,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useTexture } from "@react-three/drei";
import {
  BoxGeometry,
  CanvasTexture,
  Vector2,
  RepeatWrapping,
  SRGBColorSpace,
  PCFShadowMap,
  PerspectiveCamera,
  Vector3,
  type Texture,
} from "three";
import {
  finishes,
  frontFinishes,
  feetFinishes,
  FOOT_HEIGHT_CM,
  placements,
  type Config,
} from "./config";
import Prop from "./Props";
import { woodAppearance } from "./woodAppearance";
import { cabinetPanels } from "./cabinetGeometry";
import { dimensions } from "./config";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
const woodColor = new URL(
  "./assets/wood/Wood049_1K-JPG_Color.jpg",
  import.meta.url,
).href;
const woodNormal = new URL(
  "./assets/wood/Wood049_1K-JPG_NormalGL.jpg",
  import.meta.url,
).href;
const woodRoughness = new URL(
  "./assets/wood/Wood049_1K-JPG_Roughness.jpg",
  import.meta.url,
).href;

const materialTextures = new Map<string, Texture[]>();
function Box({
  position,
  size,
  color,
  wood = false,
  finish = "oak",
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  wood?: boolean;
  finish?: string;
}) {
  const loaded = useTexture([woodColor, woodNormal, woodRoughness]);
  const textures = useMemo(() => {
    const existing = materialTextures.get(finish);
    if (existing) return existing;
    const maps = [
      new CanvasTexture(
        woodAppearance(loaded[0].image as HTMLImageElement, finish),
      ),
      loaded[1],
      loaded[2],
    ];
    maps.forEach((texture, i) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.anisotropy = 4;
      if (i === 0) texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
    });
    materialTextures.set(finish, maps);
    return maps;
  }, [loaded, finish]);
  const [sx, sy, sz] = size;
  const [px, py] = position;
  const geometry = useMemo(() => {
    const g = new BoxGeometry(sx, sy, sz);
    const uv = g.attributes.uv;
    // Physical UV scale and board-specific offsets keep neighbouring panels distinct.
    const offset = Math.abs(px * 1.73 + py * 0.61);
    for (let face = 0; face < 6; face++) {
      const w = face < 2 ? sz : sx;
      const h = face < 2 ? sy : face < 4 ? sz : sy;
      const vertical = face < 2 || (face >= 4 && sy > sx);
      for (let v = 0; v < 4; v++) {
        const index = face * 4 + v,
          u = uv.getX(index),
          y = uv.getY(index);
        uv.setXY(
          index,
          (vertical ? y * h : u * w) / 0.3 + offset,
          (vertical ? u * w : y * h) / 0.3 + offset * 0.37,
        );
      }
    }
    return g;
  }, [sx, sy, sz, px, py]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={wood ? "#ffffff" : color}
        map={wood ? textures[0] : null}
        normalMap={wood ? textures[1] : null}
        normalScale={new Vector2(0.12, 0.12)}
        roughnessMap={wood ? textures[2] : null}
        roughness={wood ? 0.8 : 0.55}
      />
    </mesh>
  );
}
function Furniture({ config: c }: { config: Config }) {
  const width = c.columns * 0.4 + 0.04,
    base = c.legs ? FOOT_HEIGHT_CM / 100 : 0.04;
  const wood = ["oak", "walnut", "chalk"].includes(c.finish);
  const color = finishes.find((f) => f.id === c.finish)!.color,
    front = frontFinishes.find((f) => f.id === c.front)!.color;
  return (
    <group position={[0, base, 0]}>
      {cabinetPanels(c).map((panel) => (
        <Box
          key={panel.id}
          position={panel.position}
          size={panel.size}
          color={color}
          wood={wood}
          finish={c.finish}
        />
      ))}
      {c.doors &&
        Array.from({ length: c.columns }, (_, i) => (
          <group key={i}>
            <Box
              position={[-width / 2 + 0.22 + i * 0.4, 0.2, 0.184]}
              size={[0.365, 0.322, 0.012]}
              color={front}
            />
            <mesh
              position={[-width / 2 + 0.36 + i * 0.4, 0.22, 0.197]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.008, 0.008, 0.014, 24]} />
              <meshStandardMaterial
                color="#c2b49b"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
      {!c.legs && (
        <Box
          position={[0, -base / 2, 0]}
          size={[width - 0.1, base, 0.3]}
          color={color}
          wood={wood}
          finish={c.finish}
        />
      )}
      {c.legs &&
        [-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={x + ":" + z}
              position={[x * (width / 2 - 0.075), -base / 2, z * 0.13]}
              castShadow
            >
              <cylinderGeometry args={[0.009, 0.011, base, 24]} />
              <meshStandardMaterial
                color={
                  feetFinishes.find((f) => f.id === (c.feet ?? "graphite"))!
                    .color
                }
                metalness={
                  c.feet === "aluminium" || c.feet === "bronze" ? 0.75 : 0.25
                }
                roughness={0.45}
              />
            </mesh>
          )),
        )}
      {c.decor &&
        Object.entries(placements(c)).map(([key, prop]) => {
          const [column, row] = key.split(":").map(Number);
          if (column >= c.columns || row >= c.rows || (c.doors && row === 0))
            return null;
          return (
            <group
              key={key}
              position={[
                -width / 2 + 0.22 + column * 0.4,
                0.038 + row * 0.36,
                0,
              ]}
            >
              <group
                scale={
                  prop.type === "plant" ? 0.86 + ((column + row) % 3) * 0.06 : 1
                }
              >
                <Prop type={prop.type} color={prop.color} />
              </group>
            </group>
          );
        })}
    </group>
  );
}
function FramedControls({
  config,
  rotate,
}: {
  config: Config;
  rotate: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const initialized = useRef(false);
  const { camera, size, invalidate } = useThree();
  const { width, height, depth } = dimensions(config);
  // Fit a sphere enclosing the whole cabinet, including legs and knobs.
  // This also covers every orbit angle, not only the current front view.
  const radius = Math.hypot(width / 100, height / 100, (depth + 3) / 100) / 2;
  const verticalHalfAngle =
    camera instanceof PerspectiveCamera
      ? (camera.fov * Math.PI) / 360
      : Math.PI / 12;
  const horizontalHalfAngle = Math.atan(
    (Math.tan(verticalHalfAngle) * size.width) / Math.max(size.height, 1),
  );
  const minDistance =
    (radius / Math.sin(Math.min(verticalHalfAngle, horizontalHalfAngle))) *
    1.08;
  const maxDistance = Math.max(8, minDistance * 1.8);
  useLayoutEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    const direction = initialized.current
      ? camera.position.clone().sub(orbit.target).normalize()
      : new Vector3(2.2, 1.05, 3).normalize();
    const distance = initialized.current
      ? camera.position.distanceTo(orbit.target)
      : minDistance * 1.15;
    orbit.target.set(0, height / 200, 0.015);
    camera.position.copy(
      direction
        .multiplyScalar(Math.max(minDistance, Math.min(distance, maxDistance)))
        .add(orbit.target),
    );
    orbit.update();
    initialized.current = true;
    invalidate();
  }, [camera, height, minDistance, maxDistance, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.03}
      autoRotate={rotate}
      autoRotateSpeed={1.3}
      enablePan={false}
    />
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        La 3D est indisponible sur ce navigateur. Vos choix et les exports
        restent accessibles.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Scene({
  config,
  rotate,
  reset,
  onCanvas,
}: {
  config: Config;
  rotate: boolean;
  reset: number;
  onCanvas: (canvas: HTMLCanvasElement, capture: () => string) => void;
}) {
  return (
    <SceneBoundary>
      <Canvas
        key={reset}
        shadows={{ type: PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [2.2, 1.8, 3.0], fov: 32 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl, scene, camera }) =>
          onCanvas(gl.domElement, () => {
            const ratio = gl.getPixelRatio(),
              size = gl.getSize(new Vector2());
            try {
              gl.setPixelRatio(Math.min(3, 2400 / Math.max(size.x, size.y)));
              gl.render(scene, camera);
              return gl.domElement.toDataURL("image/png");
            } finally {
              gl.setPixelRatio(ratio);
              gl.render(scene, camera);
            }
          })
        }
        fallback={
          <div className="scene-error">
            WebGL indisponible. Vous pouvez configurer et exporter votre meuble.
          </div>
        }
      >
        <color attach="background" args={["#e9e6e1"]} />
        <ambientLight intensity={0.65} />
        <hemisphereLight args={["#fffaf2", "#c5c7c9", 1.2]} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={3.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-1.5}
          shadow-camera-right={1.5}
          shadow-camera-top={2}
          shadow-camera-bottom={-1.5}
          shadow-camera-near={1}
          shadow-camera-far={12}
          shadow-bias={-0.0002}
          shadow-normalBias={0.008}
          shadow-radius={2.5}
        />
        <directionalLight position={[-3, 3, -2]} intensity={1} />
        <Furniture config={config} />
        <ContactShadows
          key={[
            config.columns,
            config.rows,
            config.legs,
            config.doors,
            config.decor,
          ].join("-")}
          position={[0, -0.001, 0]}
          opacity={0.38}
          scale={4}
          blur={2.6}
          far={2.2}
          resolution={1024}
          frames={1}
          smooth
          color="#56534c"
        />
        <FramedControls config={config} rotate={rotate} />
      </Canvas>
    </SceneBoundary>
  );
}
