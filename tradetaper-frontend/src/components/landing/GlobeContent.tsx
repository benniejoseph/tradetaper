"use client";

import React, { useEffect, useState } from "react";
import ThreeGlobe from "three-globe";
import { useFrame } from "@react-three/fiber";
import { Color, MeshPhongMaterial, TextureLoader } from "three";

export type GlobeConfig = {
  pointSize?: number;
  globeImageUrl?: string;
  nightImageUrl?: string;
  bumpImageUrl?: string;
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
  const [globeObj, setGlobeObj] = useState<ThreeGlobe | null>(null);

  const defaultProps = {
    pointSize: 0.6,
    globeImageUrl: "/textures/earth-dark.jpg",
    nightImageUrl: "/textures/earth-night.jpg",
    bumpImageUrl: "/textures/earth-topology.png",
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.2,
    polygonColor: "rgba(255,255,255,0.7)",
    emissive: "#ffffff",
    emissiveIntensity: 0.6,
    shininess: 1.1,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    const globe = new ThreeGlobe()
      .globeImageUrl(defaultProps.globeImageUrl)
      .bumpImageUrl(defaultProps.bumpImageUrl)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude);

    globe.rotateY(-Math.PI * (5 / 9));
    globe.rotateZ(-Math.PI / 6);

    const globeMaterial = globe.globeMaterial() as MeshPhongMaterial;
    const textureLoader = new TextureLoader();
    const dayTexture = textureLoader.load(defaultProps.globeImageUrl);
    globeMaterial.map = dayTexture;
    if (defaultProps.nightImageUrl) {
      const nightTexture = textureLoader.load(defaultProps.nightImageUrl);
      globeMaterial.emissiveMap = nightTexture;
    }

    globeMaterial.color = new Color(globeConfig.globeColor || "#0b1020");
    globeMaterial.emissive = new Color(globeConfig.emissive || "#ffffff");
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity ?? 0.55;
    globeMaterial.shininess = globeConfig.shininess ?? 1.1;
    globeMaterial.specular = new Color("#64748b");
    globeMaterial.bumpScale = 0.55;
    globeMaterial.opacity = 1;
    globeMaterial.transparent = true;
    globeMaterial.needsUpdate = true;

    setGlobeObj(globe);
  }, [
    globeConfig.emissive,
    globeConfig.emissiveIntensity,
    globeConfig.globeColor,
    globeConfig.shininess,
    defaultProps.atmosphereAltitude,
    defaultProps.atmosphereColor,
    defaultProps.bumpImageUrl,
    defaultProps.globeImageUrl,
    defaultProps.nightImageUrl,
    defaultProps.showAtmosphere,
  ]);

  useEffect(() => {
    if (!globeObj) return;
    let active = true;

    fetch("/data/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((geo) => {
        if (!active) return;
        const features = geo?.features ?? [];
        globeObj
          .hexPolygonsData(features)
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.45)
          .hexPolygonAltitude(0.008)
          .hexPolygonUseDots(true)
          .hexPolygonDotResolution(6)
          .hexPolygonColor(() => "rgba(16, 185, 129, 0.85)");
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [globeObj]);

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
