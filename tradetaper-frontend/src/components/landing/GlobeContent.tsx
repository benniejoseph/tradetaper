"use client";

import React, { useEffect, useRef, useState } from "react";
import ThreeGlobe from "three-globe";
import { useFrame, useThree } from "@react-three/fiber";
import { Color } from "three";
import countries from "@/data/countries.json";

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
  const [globeObj, setGlobeObj] = useState<ThreeGlobe | null>(null);

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
    // Instantiate ThreeGlobe manually
    const globe = new ThreeGlobe()
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => {
        return "rgba(255,255,255, 1)";
      });

    // Rotate to initial position
    globe.rotateY(-Math.PI * (5 / 9));
    globe.rotateZ(-Math.PI / 6);
    
    // Apply material props to the globe sphere itself (ocean)
    const globeMaterial = globe.globeMaterial() as THREE.MeshPhongMaterial;
    globeMaterial.color = new Color(globeConfig.globeColor || "#3b82f6");
    globeMaterial.emissive = new Color(globeConfig.emissive || "#1d4ed8");
    globeMaterial.emissiveIntensity = 0.6;
    globeMaterial.shininess = 0.9;
    globeMaterial.opacity = 1; 
    globeMaterial.transparent = true;

    setGlobeObj(globe);
  }, []);

  useFrame(() => {
    if (globeObj && globeConfig.autoRotate) {
       globeObj.rotation.y += globeConfig.autoRotateSpeed || 0.001;
    }
  });

  return (
    <>
      {globeObj && <primitive object={globeObj} />}
    </>
  );
}
