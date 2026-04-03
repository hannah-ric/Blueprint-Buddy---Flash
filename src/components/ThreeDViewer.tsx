import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, PerspectiveCamera, Grid, Edges, DragControls } from "@react-three/drei";
import { Suspense, useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ModelPart } from "../types";
import { cn } from "../lib/utils";

interface ThreeDViewerProps {
  name?: string;
  parts?: ModelPart[];
  activeParts?: string[] | null;
}

function AnimatedPart({ part, isExploded, isActive, resetTrigger }: { part: ModelPart, isExploded: boolean, isActive: boolean, resetTrigger: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualPos, setManualPos] = useState<THREE.Vector3 | null>(null);
  
  const px = Number(part.x) || 0;
  const py = Number(part.y) || 0;
  const pz = Number(part.z) || 0;
  const pw = Number(part.width) || 1;
  const ph = Number(part.height) || 1;
  const pd = Number(part.depth) || 1;

  // Explode logic: push parts away from the center (0,0,0)
  const explodeFactor = 1.8;
  const yOffset = py > 0 ? py * 0.5 : py * 0.2;
  
  const targetX = isExploded ? px * explodeFactor : px;
  const targetY = isExploded ? (py * explodeFactor) + yOffset : py;
  const targetZ = isExploded ? pz * explodeFactor : pz;

  // Reset manual position when explosion state or resetTrigger changes
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
      <mesh ref={meshRef} position={[px, py, pz]} castShadow receiveShadow>
        <boxGeometry args={[pw, ph, pd]} />
        <meshStandardMaterial 
          color={isDragging ? "#F4A460" : "#DEB887"} 
          roughness={0.8} 
          transparent={!isActive}
          opacity={isActive ? 1 : 0.2}
        />
        <Edges scale={1} threshold={15} color="#8B4513" />
      </mesh>
    </DragControls>
  );
}

function DynamicFurniture({ parts, isExploded, activeParts, resetTrigger }: { parts: ModelPart[], isExploded: boolean, activeParts?: string[] | null, resetTrigger: number }) {
  if (!parts || parts.length === 0) return null;

  return (
    <group>
      {parts.map((part, i) => {
        const isActive = !activeParts || activeParts.length === 0 || activeParts.includes(part.name);
        return <AnimatedPart key={i} part={part} isExploded={isExploded} isActive={isActive} resetTrigger={resetTrigger} />;
      })}
    </group>
  );
}

export function ThreeDViewer({ name, parts, activeParts }: ThreeDViewerProps) {
  const [isExploded, setIsExploded] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

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
              <DynamicFurniture parts={parts} isExploded={isExploded} activeParts={activeParts} resetTrigger={resetTrigger} />
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

      <div className="absolute bottom-6 right-6 flex gap-2">
        <button 
          onClick={() => setResetTrigger(prev => prev + 1)}
          className="px-3 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-white transition-colors"
        >
          Reset
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
