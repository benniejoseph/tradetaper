"use client";

import React, { useEffect, useRef } from "react";
import ThreeGlobe from "three-globe";
import { useFrame, extend, Object3DNode } from "@react-three/fiber";
import { Color } from "three";
import countries from "@/data/countries.json";

// Extend ThreeGlobe so it can be used as a JSX element
extend({ ThreeGlobe });

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: Object3DNode<ThreeGlobe, typeof ThreeGlobe>;
  }
}

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
}

export default function GlobeContent({ globeConfig }: WorldProps) {
  const globeRef = useRef<ThreeGlobe>(null);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (globeRef.current) {
      _buildData();
      _buildMaterial();
    }
  }, [globeRef.current]);

  const _buildMaterial = () => {
    if (!globeRef.current) return;

    const globeMaterial = globeRef.current.globeMaterial() as THREE.MeshPhongMaterial;
    globeMaterial.color = new Color(globeConfig.globeColor || "#1d072e");
    globeMaterial.emissive = new Color(globeConfig.emissive || "#000000");
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.9;
  };

  const _buildData = () => {
    if (globeRef.current) {
      globeRef.current
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(defaultProps.atmosphereColor)
        .atmosphereAltitude(defaultProps.atmosphereAltitude)
        .hexPolygonColor(() => {
          return defaultProps.polygonColor;
        });
        
      globeRef.current.rotateY(-Math.PI * (5 / 9));
      globeRef.current.rotateZ(-Math.PI / 6);
    }
  };

  useFrame((state) => {
    if (!globeRef.current) return;
    
    if(globeConfig.autoRotate){
         globeRef.current.rotation.y += globeConfig.autoRotateSpeed || 0.001;
    }
  });

  return (
    <>
      <threeGlobe ref={globeRef} />
      <mesh position={[0, 200, 0]}>
        <boxGeometry args={[50, 50, 50]} />
        <meshBasicMaterial color="lime" wireframe />
      </mesh>
    </>
  );
}
