import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Trail, Sphere, Sparkles, Environment } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useStreak } from '../../context/StreakContext';
import { getStreakRank } from '../../utils/streakRank';

const ReactorCore = ({ level }) => {
  const meshRef = useRef();
  
  const rankInfo = getStreakRank(level);
  let color = rankInfo.color;
  let distort = level >= 180 ? 0.9 : level >= 90 ? 0.7 : level >= 30 ? 0.5 : 0.3;
  let speed = level >= 180 ? 5 : level >= 90 ? 3 : level >= 30 ? 2 : 1;
  const isCosmic = level >= 365;
  const isPlatinum = level >= 240 && level < 365;
  const isDiamond = level >= 180 && level < 240;
  const isGold = level >= 90 && level < 180;
  const isSilver = level >= 60 && level < 90;
  const isBronze = level >= 30 && level < 60;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (speed * 0.2);
      meshRef.current.rotation.x = state.clock.elapsedTime * (speed * 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Trail width={10} color={color} length={20} decay={1}>
        <Sphere ref={meshRef} args={[2, 64, 64]} scale={isCosmic ? 1.5 : isPlatinum ? 1.2 : 1}>
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isCosmic ? 2 : isPlatinum ? 1.5 : 1}
            distort={distort}
            speed={speed}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
        </Sphere>
      </Trail>
      
      {/* Outer Rings */}
      {level >= 30 && (
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[3, isDiamond ? 0.1 : 0.05, 16, 100]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isGold ? 3 : 2} transparent opacity={0.8} />
        </mesh>
      )}

      {level >= 90 && (
        <mesh rotation-y={Math.PI / 2}>
          <torusGeometry args={[2.5, isPlatinum ? 0.1 : 0.05, 16, 100]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isDiamond ? 3 : 2} transparent opacity={0.6} />
        </mesh>
      )}

      {(isPlatinum || isCosmic) && (
        <group>
          {Array.from({ length: isCosmic ? 12 : 6 }).map((_, i) => (
            <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
              <torusGeometry args={[3.5 + Math.random() * 2, 0.02, 16, 100]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
            </mesh>
          ))}
        </group>
      )}
    </Float>
  );
};

export default function StreakDashboardWidget() {
  const { streakData, setShowHub } = useStreak();
  const level = streakData?.currentStreak || 0;

  return (
    <div className="relative w-full h-80 md:h-96 -mt-6 mb-8 flex justify-center items-center pointer-events-none">
      {/* 3D Canvas Background */}
      <div 
        className="absolute inset-0 z-0 overflow-visible pointer-events-auto cursor-pointer" 
        style={{ transform: 'scale(1.2)' }}
        onClick={() => setShowHub(true)}
      >
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <ReactorCore level={level} />
          
          <Sparkles count={200} scale={15} size={3} speed={0.4} opacity={0.5} color="#ffffff" />
          <Environment preset="city" />
          
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Holographic Number Overlay */}
      <div className="absolute z-10 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className={`text-[100px] md:text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 ${getStreakRank(level).glow} leading-none tracking-tighter mix-blend-overlay`}>
            {level}
          </h2>
          <div className={`mt-[-20px] bg-black/40 backdrop-blur-md border px-8 py-2 rounded-full inline-block shadow-[0_0_30px_rgba(0,0,0,0.5)]`} style={{ borderColor: getStreakRank(level).color }}>
            <span className="text-white font-bold tracking-[0.3em] uppercase text-sm" style={{ textShadow: `0 0 10px ${getStreakRank(level).color}` }}>
              {getStreakRank(level).title}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade to blend with dashboard */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent z-0"></div>
    </div>
  );
}
