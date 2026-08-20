import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicFooter } from "./ui/motion-footer";
import { FuturisticHero } from "./ui/hero-futuristic";
import {
  CheckCircle2,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  Building2,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Lock,
  Database,
  FileCheck2,
  Check
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface LandingPageProps {
  onEnterDashboard: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  userSession?: { email: string; companyName?: string } | null;
  onLogout?: () => void;
}

export function LandingPage({ 
  onEnterDashboard, 
  onOpenAuth, 
  onOpenTerms,
  onOpenPrivacy,
  darkMode, 
  onToggleTheme,
  userSession,
  onLogout
}: LandingPageProps) {
  const [sampleRup, setSampleRup] = useState("Construcción & Obras Civiles (UNSPSC 72121100)");
  const [sampleLiquidity, setSampleLiquidity] = useState("1.85");

  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  // Track triggers
  const trackHeroRef = useRef<HTMLDivElement>(null);
  const trackMetricsRef = useRef<HTMLDivElement>(null);
  const trackSimulatorRef = useRef<HTMLDivElement>(null);
  const trackSecurityRef = useRef<HTMLDivElement>(null);

  // Layer cards
  const layerHeroRef = useRef<HTMLDivElement>(null);
  const layerMetricsRef = useRef<HTMLDivElement>(null);
  const layerSimulatorRef = useRef<HTMLDivElement>(null);
  const layerSecurityRef = useRef<HTMLDivElement>(null);

  // AGGRESSIVE FULL-PAGE 3D LAYER STACKING (SCROLL DOWN & UP BIDIRECTIONAL)
  useEffect(() => {
    if (typeof window === "undefined" || !pageContainerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Hero scales down and tilts when Metrics layer mounts over it
      if (layerHeroRef.current && trackMetricsRef.current && layerMetricsRef.current) {
        gsap.fromTo(
          layerHeroRef.current,
          { scale: 1, rotationX: 0, y: 0, opacity: 1, filter: "brightness(1) blur(0px)" },
          {
            scale: 0.76,
            rotationX: -18,
            y: -70,
            opacity: 0.25,
            filter: "brightness(0.35) blur(6px)",
            transformOrigin: "center top",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: trackMetricsRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );

        gsap.fromTo(
          layerMetricsRef.current,
          { y: 70, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: trackMetricsRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );
      }

      // 2. Metrics layer scales down and tilts when Simulator layer mounts over it
      if (layerMetricsRef.current && trackSimulatorRef.current && layerSimulatorRef.current) {
        gsap.fromTo(
          layerMetricsRef.current,
          { scale: 1, rotationX: 0, y: 0, opacity: 1, filter: "brightness(1) blur(0px)" },
          {
            scale: 0.80,
            rotationX: -14,
            y: -50,
            opacity: 0.35,
            filter: "brightness(0.4) blur(5px)",
            transformOrigin: "center top",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: trackSimulatorRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );

        gsap.fromTo(
          layerSimulatorRef.current,
          { y: 70, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: trackSimulatorRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );
      }

      // 3. Simulator layer scales down and tilts when Security layer mounts over it
      if (layerSimulatorRef.current && trackSecurityRef.current && layerSecurityRef.current) {
        gsap.fromTo(
          layerSimulatorRef.current,
          { scale: 1, rotationX: 0, y: 0, opacity: 1, filter: "brightness(1) blur(0px)" },
          {
            scale: 0.82,
            rotationX: -12,
            y: -40,
            opacity: 0.4,
            filter: "brightness(0.45) blur(4px)",
            transformOrigin: "center top",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: trackSecurityRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );

        gsap.fromTo(
          layerSecurityRef.current,
          { y: 70, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: trackSecurityRef.current,
              start: "top 85%",
              end: "top 20%",
              scrub: 0.3,
            },
          }
        );
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div ref={pageContainerRef} className="relative w-full bg-slate-100 dark:bg-[#030712] text-slate-900 dark:text-slate-100 min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-200" style={{ perspective: "1500px" }}>
      
      {/* =========================================================================
          GLOBAL FIXED NAVBAR (Always on top with adaptive blur & theme support)
      ========================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/80 dark:border-blue-500/20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Licit<span className="text-blue-600 dark:text-blue-400">IA</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollToSection("solucion")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Solución
            </button>
            <button onClick={() => scrollToSection("metricas")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Impacto
            </button>
            <button onClick={() => scrollToSection("simulador")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Simulador
            </button>
            <button onClick={() => scrollToSection("garantias")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Seguridad
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                title={darkMode ? "Modo Oscuro (clic para cambiar a Claro)" : "Modo Claro (clic para cambiar a Oscuro)"}
              >
                {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </button>
            )}
            
            {userSession ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="max-w-[140px] truncate">{userSession.companyName || userSession.email}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title={`Cerrar sesión (${userSession.email})`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onEnterDashboard}
                  className="text-xs sm:text-sm font-black px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Ir al Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  onClick={onEnterDashboard}
                  className="text-xs sm:text-sm font-black px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Ir al Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN LANDING STACK: ALL SECTIONS STACK & MOUNT OVER EACH OTHER IN 3D
      ========================================================================== */}
      <main className="relative w-full pt-16">
        
        {/* =======================================================================
            LAYER 1: 3D FUTURISTIC HERO TRACK (STICKY TOP-16, Z-10)
        ======================================================================== */}
        <div id="solucion" ref={trackHeroRef} className="relative min-h-[95vh] mb-8">
          <div ref={layerHeroRef} className="sticky top-16 z-10 w-full will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            <FuturisticHero
              onEnterDashboard={onEnterDashboard}
              onExploreClick={() => scrollToSection("metricas")}
              onRegisterClick={() => onOpenAuth('register')}
            />
          </div>
        </div>

        {/* =======================================================================
            LAYER 2: IMPACT METRICS TRACK (MOUNTS OVER HERO, Z-20)
        ======================================================================== */}
        <div id="metricas" ref={trackMetricsRef} className="relative min-h-[95vh] mb-8">
          <section
            ref={layerMetricsRef}
            className="sticky top-16 z-20 w-full rounded-t-[3rem] bg-white dark:bg-slate-900/98 border-t-2 border-blue-500/40 dark:border-blue-500 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_-30px_90px_rgba(37,99,235,0.45)] py-20 px-6 backdrop-blur-2xl will-change-transform transition-colors"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser accent line */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_#3b82f6]" />

            <div className="max-w-6xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>Capa 01 · Impacto Comprobado</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Resultados que transforman la forma de <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300">
                    ganar contratos con el Estado
                  </span>
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Elimina la incertidumbre antes de radicar. Cada indicador está respaldado por el motor de reglas y modelos LLM especializados en pliegos colombianos.
                </p>
              </div>

              {/* 4 Large Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-blue-500/40 shadow-sm hover:border-blue-500 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">95%</div>
                  <div className="text-base font-black text-blue-600 dark:text-blue-300 mb-2">Ahorro de Tiempo</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    De 6 horas leyendo pliegos y adendas a un resumen ejecutivo estructurado en menos de 10 segundos.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-emerald-500/40 shadow-sm hover:border-emerald-500 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-xs">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">0%</div>
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mb-2">Descalificaciones Inadvertidas</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Detección automática de causales de rechazo ocultas en anexos técnicos y matrices financieras.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-indigo-500/40 shadow-sm hover:border-indigo-500 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-xs">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-2">100%</div>
                  <div className="text-base font-black text-indigo-700 dark:text-indigo-300 mb-2">Precisión RUP & Finanzas</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Cálculo determinístico de liquidez, endeudamiento, cobertura de intereses y SMMLV acumulados.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-sky-500/40 shadow-sm hover:border-sky-500 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-6 shadow-xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-sky-600 dark:text-sky-400 mb-2">10 Nodos</div>
                  <div className="text-base font-black text-sky-700 dark:text-sky-300 mb-2">Pipeline de Agentes</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Flujo integral: ingesta SODA, RAG sobre PDFs, matching matemático y checklist para SECOP II.
                  </p>
                </div>
              </div>

              {/* Action Strip */}
              <div className="mt-14 text-center">
                <button
                  onClick={() => scrollToSection("simulador")}
                  className="inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer group"
                >
                  <span>Probar el simulador interactivo en la siguiente capa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* =======================================================================
            LAYER 3: INTERACTIVE PLIEGO SIMULATOR TRACK (MOUNTS OVER METRICS, Z-30)
        ======================================================================== */}
        <div id="simulador" ref={trackSimulatorRef} className="relative min-h-[96vh] mb-8">
          <section
            ref={layerSimulatorRef}
            className="sticky top-16 z-30 w-full rounded-t-[3rem] bg-slate-50 dark:bg-slate-950/98 border-t-2 border-indigo-500/40 dark:border-indigo-500 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_-30px_90px_rgba(99,102,241,0.5)] py-20 px-6 backdrop-blur-2xl will-change-transform transition-colors"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_#6366f1]" />

            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Capa 02 · Simulador Interactivo en Vivo</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
                  Motor de Compatibilidad en Tiempo Real
                </h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-medium">
                  Prueba cómo el motor de LicitIA pondera requisitos (40% financiero, 40% experiencia RUP/UNSPSC, 20% jurídico) y genera veredictos inmediatos.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-xl">
                <div className="lg:col-span-5 space-y-5">
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Simulador interactivo</div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Proceso: CO1.PXP.789456 (Mantenimiento Vial)</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Actividad RUP / UNSPSC de la empresa</label>
                    <input
                      type="text"
                      value={sampleRup}
                      onChange={(e) => setSampleRup(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-indigo-500/40 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Índice de Liquidez Actual (Min. requerido: 1.5)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={sampleLiquidity}
                      onChange={(e) => setSampleLiquidity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-indigo-500/40 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-300 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Resumen generado por Gemini LLM
                    </div>
                    <p className="leading-relaxed">
                      La empresa cumple con el índice de liquidez solicitado en el pliego definitivo y posee los códigos UNSPSC habilitantes. Riesgo legal bajo.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-indigo-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full space-y-6 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-500/30 pb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Veredicto Calculado</span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        RECOMMENDED (88.5 / 100)
                      </div>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 text-xs font-black">
                      Apto para postular
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">Capacidad Financiera (40%)</span>
                        <span className="text-blue-600 dark:text-blue-400">100% Cumplido</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">Experiencia RUP & SMMLV (40%)</span>
                        <span className="text-blue-600 dark:text-blue-400">85% Cumplido</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[85%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">Requisitos Jurídicos y Pliego (20%)</span>
                        <span className="text-blue-600 dark:text-blue-400">100% Verificado</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Procesado por PyMuPDF + RAG</span>
                    <button onClick={onEnterDashboard} className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer">
                      Abrir en el Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =======================================================================
            LAYER 4: ENTERPRISE SECURITY & SECOP INTEGRATION TRACK (MOUNTS OVER SIMULATOR, Z-40)
        ======================================================================== */}
        <div id="garantias" ref={trackSecurityRef} className="relative min-h-[88vh] mb-8">
          <section
            ref={layerSecurityRef}
            className="sticky top-16 z-40 w-full rounded-t-[3rem] bg-slate-50 dark:bg-slate-950 border-t-2 border-cyan-500/40 dark:border-cyan-400 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_-35px_100px_rgba(34,211,238,0.6)] py-20 px-6 text-slate-900 dark:text-white backdrop-blur-2xl will-change-transform transition-colors"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 dark:via-cyan-400 to-transparent shadow-[0_0_25px_#22d3ee]" />

            <div className="max-w-6xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 dark:border-cyan-500/40 bg-cyan-500/10 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest mb-3 shadow-xs">
                  <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Capa 03 · Seguridad & Conexión Oficial</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Tecnología Empresarial Diseñada para <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
                    Contratistas del Estado Colombiano
                  </span>
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-medium">
                  Tus datos financieros, certificados de Cámara de Comercio y contratos RUP están protegidos bajo estándares de seguridad multitenant y cifrado de grado bancario.
                </p>
              </div>

              {/* 3 Security Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 hover:border-cyan-500 dark:hover:border-cyan-400 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Aislamiento RLS en PostgreSQL</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Políticas de Row-Level Security que garantizan que la información de tu RUP y balances solo sea accesible por tu organización.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 font-bold pt-2">
                    <Check className="w-4 h-4" /> Multitenancy estricto
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">API SODA de Datos Abiertos</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Consumo directo de la infraestructura oficial de Colombia Compra Eficiente. Respaldos locales para disponibilidad 24/7.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold pt-2">
                    <Check className="w-4 h-4" /> SECOP I y SECOP II
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 hover:border-emerald-500 dark:hover:border-emerald-400 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Expedientes Listos para Radicar</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Empaquetado inteligente de documentos habilitantes, cartas de presentación y formatos en un archivo ZIP estructurado.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-2">
                    <Check className="w-4 h-4" /> Checklist de postulación
                  </div>
                </div>
              </div>

              {/* High-voltage Call to Action Bar */}
              <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-2xl font-black text-white">Empieza a evaluar licitaciones hoy</h4>
                  <p className="text-xs text-blue-100 font-medium">Prueba gratis con los procesos publicados en SECOP esta semana.</p>
                </div>
                <button
                  onClick={onEnterDashboard}
                  className="px-9 py-4 rounded-full bg-white text-blue-900 font-black text-sm hover:bg-slate-100 transition-all shadow-xl flex items-center gap-2.5 cursor-pointer shrink-0 hover:scale-105"
                >
                  <span>Acceder a la Plataforma</span>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>
          </section>
        </div>


      </main>

      {/* =========================================================================
          FINAL LAYER: CINEMATIC REVEAL FOOTER (Curtain Reveal Effect)
      ========================================================================== */}
      <CinematicFooter 
        onEnterApp={onEnterDashboard}
        onOpenAuth={() => onOpenAuth('register')}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />

    </div>
  );
}
