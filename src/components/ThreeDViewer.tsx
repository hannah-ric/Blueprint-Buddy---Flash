import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, PerspectiveCamera, Grid, Edges, DragControls, Html, Line } from "@react-three/drei";
import React, { Suspense, useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { ModelPart } from "../types";
import { cn } from "../lib/utils";

interface ThreeDViewerProps {
  name?: string;
  parts?: ModelPart[];
  activeParts?: string[] | null;
  primaryMaterial?: string;
}

const MATERIAL_COLORS: Record<string, string> = {
  walnut: "#5C4033",
  oak: "#C4A76A",
  "white oak": "#C4A76A",
  "red oak": "#B8956A",
  cherry: "#8B4513",
  maple: "#E8D5B7",
  "hard maple": "#E8D5B7",
  ash: "#D4C4A0",
  mahogany: "#6B3A2E",
  poplar: "#C5B78E",
  hickory: "#B59A6B",
  teak: "#8B7355",
  alder: "#C4A882",
  birch: "#D2BA8E",
  pine: "#DEB887",
  cedar: "#A0522D",
  "douglas fir": "#CD9B5A",
  spruce: "#D2C4A0",
  plywood: "#D2B48C",
  "baltic birch plywood": "#D2B48C",
  "birch plywood": "#C9AE7A",
  "oak plywood": "#B89E6A",
  "walnut plywood": "#7B5B42",
  mdf: "#B0A89A",
  "particle board": "#A09080",
  melamine: "#E8E4DC",
  metal: "#C0C0C0",
  steel: "#808080",
  iron: "#696969",
};

function getMaterialColor(materialName?: string, fallback = "#DEB887"): string {
  if (!materialName) return fallback;
  const lower = materialName.toLowerCase();
  for (const [key, color] of Object.entries(MATERIAL_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return fallback;
}

interface AnimatedPartProps {
  key?: React.Key;
  part: ModelPart;
  isExploded: boolean;
  isActive: boolean;
  resetTrigger: number;
  showLabels: boolean;
  materialColor: string;
}

function AnimatedPart({ part, isExploded, isActive, resetTrigger, showLabels, materialColor }: AnimatedPartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualPos, setManualPos] = useState<THREE.Vector3 | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const px = Number(part.x) || 0;
  const py = Number(part.y) || 0;
  const pz = Number(part.z) || 0;
  const pw = Number(part.width) || 1;
  const ph = Number(part.height) || 1;
  const pd = Number(part.depth) || 1;

  // Explode logic
  const explodeFactor = 1.8;
  const yOffset = py > 0 ? py * 0.5 : py * 0.2;

  const targetX = isExploded ? px * explodeFactor : px;
  const targetY = isExploded ? (py * explodeFactor) + yOffset : py;
  const targetZ = isExploded ? pz * explodeFactor : pz;

  // Highlight color when dragging
  const activeColor = isDragging ? "#F4A460" : materialColor;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualPos(null);
  }, [isExploded, resetTrigger]);

  useFrame((_, delta) => {
    if (meshRef.current && !isDragging && !manualPos) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 8 * delta);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 8 * delta);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 8 * delta);
    }
  });

  return (
    <DragControls
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false);
        if (meshRef.current) {
          setManualPos(meshRef.current.position.clone());
        }
      }}
    >
      <mesh
        ref={meshRef}
        position={[px, py, pz]}
        castShadow
        receiveShadow
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <boxGeometry args={[pw, ph, pd]} />
        <meshStandardMaterial
          color={activeColor}
          roughness={0.8}
          transparent={!isActive}
          opacity={isActive ? 1 : 0.2}
        />
        <Edges scale={1} threshold={15} color={isHovered ? "#FF6B00" : "#8B4513"} />
        {(showLabels || isHovered) && isActive && (
          <Html
            position={[0, ph / 2 + 1, 0]}
            center
            distanceFactor={80}
            style={{ pointerEvents: "none" }}
          >
            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[9px] font-mono text-gray-800 whitespace-nowrap border border-gray-200 shadow-sm">
              {part.name}
            </div>
          </Html>
        )}
      </mesh>
    </DragControls>
  );
}

function DimensionLine({ start, end, label, offset }: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset: [number, number, number];
}) {
  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2 + offset[0],
    (start[1] + end[1]) / 2 + offset[1],
    (start[2] + end[2]) / 2 + offset[2],
  ];

  const lineStart: [number, number, number] = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const lineEnd: [number, number, number] = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];

  return (
    <group>
      <Line points={[lineStart, lineEnd]} color="#666" lineWidth={1} dashed dashScale={3} />
      {/* Extension lines */}
      <Line points={[start, lineStart]} color="#999" lineWidth={0.5} />
      <Line points={[end, lineEnd]} color="#999" lineWidth={0.5} />
      <Html position={mid} center style={{ pointerEvents: "none" }}>
        <div className="bg-white/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-gray-600 whitespace-nowrap border border-gray-100">
          {label}
        </div>
      </Html>
    </group>
  );
}

function DimensionAnnotations({ parts, units }: { parts: ModelPart[]; units?: string }) {
  const bounds = useMemo(() => {
    if (!parts?.length) return null;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of parts) {
      const hw = (Number(p.width) || 1) / 2;
      const hh = (Number(p.height) || 1) / 2;
      const hd = (Number(p.depth) || 1) / 2;
      const px = Number(p.x) || 0;
      const py = Number(p.y) || 0;
      const pz = Number(p.z) || 0;
      minX = Math.min(minX, px - hw);
      maxX = Math.max(maxX, px + hw);
      minY = Math.min(minY, py - hh);
      maxY = Math.max(maxY, py + hh);
      minZ = Math.min(minZ, pz - hd);
      maxZ = Math.max(maxZ, pz + hd);
    }
    return { minX, maxX, minY, maxY, minZ, maxZ };
  }, [parts]);

  if (!bounds) return null;

  const u = units || "in";
  const gap = 5;

  return (
    <group>
      {/* Width (X-axis) */}
      <DimensionLine
        start={[bounds.minX, bounds.minY, bounds.maxZ]}
        end={[bounds.maxX, bounds.minY, bounds.maxZ]}
        label={`${(bounds.maxX - bounds.minX).toFixed(1)} ${u}`}
        offset={[0, 0, gap]}
      />
      {/* Height (Y-axis) */}
      <DimensionLine
        start={[bounds.maxX, bounds.minY, bounds.maxZ]}
        end={[bounds.maxX, bounds.maxY, bounds.maxZ]}
        label={`${(bounds.maxY - bounds.minY).toFixed(1)} ${u}`}
        offset={[gap, 0, gap]}
      />
      {/* Depth (Z-axis) */}
      <DimensionLine
        start={[bounds.maxX, bounds.minY, bounds.minZ]}
        end={[bounds.maxX, bounds.minY, bounds.maxZ]}
        label={`${(bounds.maxZ - bounds.minZ).toFixed(1)} ${u}`}
        offset={[gap, 0, 0]}
      />
    </group>
  );
}

function DynamicFurniture({ parts, isExploded, activeParts, resetTrigger, showLabels, showDimensions, primaryMaterial, units }: {
  parts: ModelPart[];
  isExploded: boolean;
  activeParts?: string[] | null;
  resetTrigger: number;
  showLabels: boolean;
  showDimensions: boolean;
  primaryMaterial?: string;
  units?: string;
}) {
  if (!parts || parts.length === 0) return null;

  return (
    <group>
      {parts.map((part, i) => {
        const isActive = !activeParts || activeParts.length === 0 || activeParts.some(ap => 
          part.name.toLowerCase().includes(ap.toLowerCase()) || ap.toLowerCase().includes(part.name.toLowerCase())
        );
        const materialColor = getMaterialColor(part.material || primaryMaterial);
        return (
          <AnimatedPart
            key={i}
            part={part}
            isExploded={isExploded}
            isActive={isActive}
            resetTrigger={resetTrigger}
            showLabels={showLabels}
            materialColor={materialColor}
          />
        );
      })}
      {showDimensions && !isExploded && (
        <DimensionAnnotations parts={parts} units={units} />
      )}
    </group>
  );
}

export function ThreeDViewer({ name, parts, activeParts, primaryMaterial }: ThreeDViewerProps) {
  const [isExploded, setIsExploded] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full bg-[#E4E3E0] relative overflow-hidden"
    >
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-2xl font-light serif italic text-gray-800">{name || "Design Preview"}</h3>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mt-1">Interactive 3D Model</p>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={50} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            {parts && parts.length > 0 ? (
              <DynamicFurniture
                parts={parts}
                isExploded={isExploded}
                activeParts={activeParts}
                resetTrigger={resetTrigger}
                showLabels={showLabels}
                showDimensions={showDimensions}
                primaryMaterial={primaryMaterial}
              />
            ) : (
              <mesh>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color="#cccccc" />
              </mesh>
            )}
          </Stage>
        </Suspense>
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        <Grid
          infiniteGrid
          fadeDistance={200}
          fadeStrength={5}
          cellSize={10}
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#141414"
          cellColor="#141414"
          cellThickness={0.5}
        />
      </Canvas>

      <div className="absolute bottom-6 right-6 flex gap-2 flex-wrap justify-end">
        <button
          onClick={() => setResetTrigger(prev => prev + 1)}
          className="px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn("px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors", showLabels ? "opacity-100 border-orange-300" : "opacity-60")}
        >
          Labels
        </button>
        <button
          onClick={() => setShowDimensions(!showDimensions)}
          className={cn("px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors", showDimensions ? "opacity-100 border-orange-300" : "opacity-60")}
        >
          Dims
        </button>
        <button
          onClick={() => setIsExploded(false)}
          className={cn("px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors", !isExploded ? "opacity-100" : "opacity-50")}
        >
          Assembled
        </button>
        <button
          onClick={() => setIsExploded(true)}
          className={cn("px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors", isExploded ? "opacity-100" : "opacity-50")}
        >
          Exploded
        </button>
      </div>
    </motion.div>
  );
}
