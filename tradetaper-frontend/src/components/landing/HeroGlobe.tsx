"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import styles from "./HeroGlobe.module.css";

const GlobeContent = dynamic(() => import("./GlobeContent"), { ssr: false });

export default function HeroGlobe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const globeConfig = {
    globeImageUrl: "/textures/earth-dark.jpg",
    nightImageUrl: "/textures/earth-night.jpg",
    bumpImageUrl: "/textures/earth-topology.png",
    showAtmosphere: true,
    atmosphereColor: "#34d399",
    atmosphereAltitude: 0.24,
    globeColor: "#0b1020",
    emissive: "#ffffff",
    emissiveIntensity: 0.4,
    shininess: 1.2,
    ambientLight: "#34d399",
    directionalLeftLight: "#a7f3d0",
    directionalTopLight: "#ffffff",
    pointLight: "#34d399",
    autoRotate: true,
    autoRotateSpeed: 0.0012,
  };

  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.starfield}></div>
      <div className={styles.starfieldDense}></div>
      <div className={styles.starfieldNebula}></div>
      <div className={styles.comets}>
        <span className={`${styles.comet} ${styles.cometA}`}></span>
        <span className={`${styles.comet} ${styles.cometB}`}></span>
        <span className={`${styles.comet} ${styles.cometC}`}></span>
      </div>
      <div className={styles.globeCanvas}>
        <Canvas
          camera={{ position: [0, 0, 250], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight color={globeConfig.ambientLight} intensity={0.3} />
          <directionalLight
            color={globeConfig.directionalTopLight}
            position={[200, 200, 150]}
            intensity={0.5}
          />
          <pointLight
            color={globeConfig.pointLight}
            position={[-200, 200, 200]}
            intensity={0.55}
          />
        {mounted && (
            <group position={[0, -80, 0]} scale={1.22}>
              <GlobeContent globeConfig={globeConfig} />
            </group>
          )}
        </Canvas>
      </div>
      <div className={styles.globeOverlay}>
        <div className={styles.globeHalo}></div>
        <div className={styles.globeRim}></div>
      </div>
    </div>
  );
}
