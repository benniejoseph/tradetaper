"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Globe(props: any) {
  const ref = useRef<THREE.Points>(null);
  
  // Generate points on a sphere manually to avoid maath issues
  const sphere = useMemo(() => {
    const count = 5000;
    const radius = 1.5;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#10b981" // Emerald-500
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function HeroGlobe() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Globe />
      </Canvas>
    </div>
  );
}
