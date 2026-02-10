"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame, extend, Object3DNode } from "@react-three/fiber";
import { Color } from "three";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/countries.json";

// Dynamically import ThreeGlobe to avoid SSR issues
const ThreeGlobe = dynamic(() => import("three-globe"), { ssr: false });

// Extend ThreeGlobe so it can be used as a JSX element
// We need to do this inside a component or useEffect if ThreeGlobe is dynamically imported, 
// OR we can just use the primitive directly if we cast it. 
// Actually, extending in module scope might fail if ThreeGlobe isn't loaded yet.
// Let's try a different approach: Create a client-side only component for the whole Canvas or just the Globe content.
// The error `ReferenceError: window is not defined` likely comes from `three-globe` being imported at module level or used in render.

// Let's wrap the THREE part in a component that is dynamically imported with ssr: false.
const GlobeContent = dynamic(() => import("./GlobeContent"), { ssr: false });

export default function HeroGlobe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const globeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#3b82f6", // Blue/Purple glow
    atmosphereAltitude: 0.25,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    autoRotate: true,
    autoRotateSpeed: 0.001
  };
  
  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
       <Canvas camera={{ position: [0, 0, 450], fov: 45 }}>
        <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
        <pointLight color={globeConfig.pointLight} position={[-200, 500, 200]} intensity={0.8} />
        {mounted && (
           <group position={[0, -250, 0]}> {/* Position at bottom of screen */}
             <GlobeContent globeConfig={globeConfig} />
           </group>
        )}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
