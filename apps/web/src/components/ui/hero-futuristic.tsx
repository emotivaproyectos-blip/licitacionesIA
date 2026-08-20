import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAspect, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';
import { ArrowDown, Zap, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

const TEXTUREMAP = { src: 'https://i.postimg.cc/XYwvXN8D/img-4.png' };
const DEPTHMAP = { src: 'https://i.postimg.cc/2SHKQh2q/raw-4.webp' };

const HERO_STYLES = `
@keyframes word-slide-up {
  0% {
    transform: translateY(180%) rotateX(-65deg) scale(0.65);
    opacity: 0;
    filter: blur(16px);
  }
  60% {
    transform: translateY(-16%) rotateX(10deg) scale(1.08);
    opacity: 1;
    filter: blur(0px);
  }
  80% {
    transform: translateY(4%) rotateX(-4deg) scale(0.96);
  }
  100% {
    transform: translateY(0) rotateX(0deg) scale(1);
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes subtitle-slide-up {
  0% {
    transform: translateY(100%);
    opacity: 0;
    filter: blur(8px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes cyber-shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes subtle-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.fade-in {
  display: inline-block;
  will-change: transform, opacity, filter;
  animation: word-slide-up 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.fade-in-subtitle {
  display: inline-block;
  will-change: transform, opacity, filter;
  animation: subtitle-slide-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.title-float {
  animation: subtle-float 6s ease-in-out infinite;
}

.shimmer-text-dark {
  background: linear-gradient(90deg, #60a5fa 0%, #38bdf8 25%, #ffffff 50%, #818cf8 75%, #3b82f6 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cyber-shimmer 4s linear infinite;
}

.shimmer-text-light {
  background: linear-gradient(90deg, #2563eb 0%, #0284c7 25%, #4f46e5 50%, #0ea5e9 75%, #2563eb 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cyber-shimmer 4s linear infinite;
}

.hero-glow-shadow-dark {
  filter: drop-shadow(0 0 35px rgba(37, 99, 235, 0.45));
}

.hero-glow-shadow-light {
  filter: drop-shadow(0 4px 20px rgba(37, 99, 235, 0.15));
}
`;

const WIDTH = 300;
const HEIGHT = 300;

function Scene3D() {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);
  const meshRef = useRef<Mesh>(null);
  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock, pointer }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, pointer.x * 0.2, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -pointer.y * 0.2, 0.05);
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.08;
    }
  });

  const scaleFactor = 0.42;

  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <meshStandardMaterial
        map={rawMap}
        displacementMap={depthMap}
        displacementScale={0.08}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function CyberParticles({ count = 140 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 12;
      p[i * 3 + 1] = (Math.random() - 0.5) * 12;
      p[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#38bdf8"
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

export interface FuturisticHeroProps {
  onEnterDashboard?: () => void;
  onExploreClick?: () => void;
  onRegisterClick?: () => void;
}

export function FuturisticHero({ onEnterDashboard, onExploreClick, onRegisterClick }: FuturisticHeroProps) {
  // Ordered words matching user request
  const titleWords = ['GANA', 'MÁS', 'LICITACIONES', 'EN', 'SECOP', 'CON', 'INTELIGENCIA', 'ARTIFICIAL'];
  const subtitle = 'Lectura automática de pliegos, compatibilidad RUP y alistamiento de ofertas en segundos.';

  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Setup random micro-delays for organic glitch/stagger
  useEffect(() => {
    setDelays(titleWords.map(() => Math.random() * 0.06));
  }, []);

  // Sequential word-by-word animation trigger
  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => {
        setVisibleWords(prev => prev + 1);
      }, 240); // 240ms between each word for crisp kinetic cadence
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setSubtitleVisible(true);
        setIsAnimationComplete(true);
      }, 450);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  const handleReplay = () => {
    setVisibleWords(0);
    setSubtitleVisible(false);
    setIsAnimationComplete(false);
  };

  return (
    <section className="relative w-full min-h-[85vh] md:min-h-[92vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden flex items-center justify-center pt-16 pb-20 select-none transition-colors duration-200">
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />

      {/* Ambient Cyber Grid & Radial Glow (Theme Adaptive) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.25)_0%,transparent_70%)] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none z-10 opacity-70" />

      {/* Main Foreground Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center">
        
        {/* Word-by-Word Kinetic Slide Title */}
        <div className={`mb-8 hero-glow-shadow-light dark:hero-glow-shadow-dark ${isAnimationComplete ? 'title-float' : ''}`}>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.2]">
            <div className="flex flex-wrap justify-center items-center gap-x-3.5 sm:gap-x-5 gap-y-2 sm:gap-y-3">
              {titleWords.map((word, index) => {
                const isSpecial = word === 'SECOP' || word === 'INTELIGENCIA' || word === 'ARTIFICIAL';
                const isCurrent = index < visibleWords;

                return (
                  <span
                    key={index}
                    className="inline-block overflow-hidden py-1 px-1 -my-1"
                    style={{ perspective: '800px' }}
                  >
                    <span
                      className={`inline-block transform-gpu transition-all ${
                        isCurrent ? 'fade-in' : 'opacity-0 translate-y-full'
                      } ${
                        isSpecial
                          ? 'shimmer-text-light dark:shimmer-text-dark font-black'
                          : 'text-slate-900 dark:text-slate-100 font-black'
                      }`}
                      style={{
                        animationDelay: `${delays[index] || 0}s`,
                      }}
                    >
                      {word}
                    </span>
                  </span>
                );
              })}
            </div>
          </h1>
        </div>

        {/* Subtitle with Masked Kinetic Reveal */}
        <div className="overflow-hidden mb-10 max-w-3xl">
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            <span
              className={`inline-block ${
                subtitleVisible ? 'fade-in-subtitle' : 'opacity-0 translate-y-full'
              }`}
            >
              {subtitle}
            </span>
          </p>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 hover:scale-105 transition-all cursor-pointer"
          >
            <span>Explorar Licitaciones Activas</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Simulador de Compatibilidad RUP</span>
          </button>
        </div>

        {/* Small Replay Button */}
        {isAnimationComplete && (
          <button
            onClick={handleReplay}
            title="Repetir animación"
            className="mt-6 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Repetir animación</span>
          </button>
        )}
      </div>

      {/* Scroll to Explore Floating Indicator */}
      <button
        onClick={onExploreClick}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase transition-colors cursor-pointer"
      >
        <span>Desplázate para explorar</span>
        <ArrowDown className="w-4 h-4 animate-bounce text-blue-600 dark:text-blue-400" />
      </button>

      {/* 3D Background Canvas (Adaptive opacity for Light and Dark modes) */}
      <div className="absolute inset-0 z-0 opacity-25 dark:opacity-45 pointer-events-none transition-opacity duration-300">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#60a5fa" />
          <pointLight position={[-5, -5, -2]} intensity={0.8} color="#3b82f6" />
          <React.Suspense fallback={null}>
            <Scene3D />
            <CyberParticles count={140} />
          </React.Suspense>
        </Canvas>
      </div>
    </section>
  );
}

export default FuturisticHero;
