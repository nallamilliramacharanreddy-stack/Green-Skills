import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cone, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export default function StreakCore3D({ streakLevel = 1 }) {
  const flameRef = useRef();

  // Premium Plasma Flame Colors
  let color = '#38bdf8'; // Blue Plasma Flame
  if (streakLevel >= 7) color = '#a855f7'; // Purple Plasma Flame
  if (streakLevel >= 30) color = '#f43f5e'; // Pink/Red Plasma Flame
  if (streakLevel >= 100) color = '#fbbf24'; // Golden Plasma Flame

  useFrame((state) => {
    if (flameRef.current) {
      flameRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Outer Holographic Plasma Flame */}
      <Cone ref={flameRef} args={[1.5, 4, 64]} position={[0, -0.5, 0]}>
        <MeshDistortMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={4}
          distort={0.6}
          speed={6}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </Cone>

      {/* Inner Hot Core */}
      <Cone args={[0.8, 2, 32]} position={[0, -0.8, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </Cone>

      {/* Embers floating up from the flame */}
      <Sparkles count={200} scale={[3, 5, 3]} position={[0, 1, 0]} size={4} speed={3} color={color} opacity={0.8} blending={THREE.AdditiveBlending} />
    </Float>
  );
}
