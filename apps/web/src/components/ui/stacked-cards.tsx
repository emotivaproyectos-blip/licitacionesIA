import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, FileSearch, TrendingUp, ArrowRight, CheckCircle2, Zap, Layers, Sparkles } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StackedCardsProps {
  onEnterDashboard?: () => void;
}

export function StackedCards({ onEnterDashboard }: StackedCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const track3Ref = useRef<HTMLDivElement>(null);

  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // CARD 2 MOUNTS OVER CARD 1 ON SCROLL DOWN (BIDIRECTIONAL)
      if (card1Ref.current && track2Ref.current && card2Ref.current) {
        // Card 1 tilts back, shrinks & dims as user scrolls down
        gsap.fromTo(
          card1Ref.current,
          { scale: 1, rotationX: 0, y: 0, opacity: 1, filter: "brightness(1) blur(0px)" },
          {
            scale: 0.78,
            rotationX: -16,
            y: -50,
            opacity: 0.35,
            filter: "brightness(0.4) blur(4px)",
            transformOrigin: "center top",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: track2Ref.current,
              start: "top 80%",
              end: "top 25%",
              scrub: 0.3,
            },
          }
        );

        // Card 2 physically enters from bottom and scales up to mount directly on Card 1
        gsap.fromTo(
          card2Ref.current,
          { y: 60, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: track2Ref.current,
              start: "top 80%",
              end: "top 25%",
              scrub: 0.3,
            },
          }
        );
      }

      // CARD 3 MOUNTS OVER CARD 2 ON SCROLL DOWN (BIDIRECTIONAL)
      if (card2Ref.current && track3Ref.current && card3Ref.current) {
        // Card 2 tilts back, shrinks & dims as user scrolls down
        gsap.fromTo(
          card2Ref.current,
          { scale: 1, rotationX: 0, y: 0, opacity: 1, filter: "brightness(1) blur(0px)" },
          {
            scale: 0.82,
            rotationX: -12,
            y: -35,
            opacity: 0.45,
            filter: "brightness(0.45) blur(3px)",
            transformOrigin: "center top",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: track3Ref.current,
              start: "top 80%",
              end: "top 25%",
              scrub: 0.3,
            },
          }
        );

        // Card 3 physically enters from bottom and scales up to mount directly on Card 2
        gsap.fromTo(
          card3Ref.current,
          { y: 60, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: track3Ref.current,
              start: "top 80%",
              end: "top 25%",
              scrub: 0.3,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="como-funciona" ref={containerRef} className="relative py-20 px-6 max-w-5xl mx-auto" style={{ perspective: "1400px" }}>
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>SUPERPOSICIÓN EN CAPAS 3D BIDIRECCIONAL</span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Flujo de postulación <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400">
            montado capa a capa al hacer scroll
          </span>
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Tanto al bajar como al subir, cada carta se desliza, se monta e inclina tridimensionalmente sobre la anterior.
        </p>
      </div>

      {/* STACK CONTAINER WITH DEDICATED TRACKS */}
      <div className="relative">
        
        {/* =========================================================================
            CARD 1 TRACK (STICKY TOP-24, 3D PERSPECTIVE)
        ========================================================================== */}
        <div ref={track1Ref} className="min-h-[85vh] mb-16 relative">
          <div
            ref={card1Ref}
            className="sticky top-24 z-10 w-full rounded-[2.5rem] border-2 border-blue-500/40 dark:border-blue-500 bg-white/98 dark:bg-slate-900/95 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08),0_0_30px_rgba(37,99,235,0.15)] dark:shadow-[0_0_60px_rgba(37,99,235,0.4),0_30px_90px_rgba(0,0,0,0.9)] transition-all will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_#3b82f6]" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Capa 01 · Ingesta SODA en Tiempo Real</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Monitoreo 24/7 de Procesos SECOP I, II & Datos Abiertos
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Conexión directa vía API SODA de Colombia Compra Eficiente. Monitorea procesos activos, filtra por departamento, cuantía y clasificador de bienes y servicios (UNSPSC) sin perder ninguna oportunidad.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-blue-950/80 border border-slate-200 dark:border-blue-500/30 text-slate-800 dark:text-blue-300 shadow-xs">
                    ⚡ Sincronización SODA en Vivo
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-blue-950/80 border border-slate-200 dark:border-blue-500/30 text-slate-800 dark:text-blue-300 shadow-xs">
                    📍 Filtro Territorial Preciso
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-blue-950/80 border border-slate-200 dark:border-blue-500/30 text-slate-800 dark:text-blue-300 shadow-xs">
                    💰 Alertas Inmediatas
                  </span>
                </div>
              </div>

              {/* Preview Box Capa 1 */}
              <div className="w-full lg:w-80 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-blue-500/40 p-6 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider">
                  <span>FEED SECOP EN VIVO</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    EN DIRECTO
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 shadow-xs space-y-2">
                  <div className="text-xs font-black text-slate-900 dark:text-white">CO1.PXP.204910</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Mantenimiento de infraestructura tecnológica</div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">$850.000.000 COP</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 shadow-xs space-y-2">
                  <div className="text-xs font-black text-slate-900 dark:text-white">CO1.BD.104820</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Consultoría e interventoría de software</div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">$420.000.000 COP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 2 TRACK (STICKY TOP-24, HIGH IMPACT OVERLAY)
        ========================================================================== */}
        <div ref={track2Ref} className="min-h-[85vh] mb-16 relative">
          <div
            ref={card2Ref}
            className="sticky top-24 z-20 w-full rounded-[2.5rem] border-2 border-indigo-500/40 dark:border-indigo-500 bg-white/98 dark:bg-slate-900/95 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.12),0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_80px_rgba(99,102,241,0.5),0_35px_100px_rgba(0,0,0,0.95)] transition-all will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_#6366f1]" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
                  <FileSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Capa 02 · Visión RAG & Extracción de Pliegos</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Lectura & Análisis de Pliegos de 200+ Páginas en Segundos
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  El motor de visión y RAG procesa pliegos PDF masivos con PyMuPDF. Extrae automáticamente indicadores de liquidez, endeudamiento, cobertura de intereses y experiencia en SMMLV sin dejar pasar una sola adenda.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-indigo-950/80 border border-slate-200 dark:border-indigo-500/30 text-slate-800 dark:text-indigo-300 shadow-xs">
                    📄 PyMuPDF + Embeddings Vectoriales
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-indigo-950/80 border border-slate-200 dark:border-indigo-500/30 text-slate-800 dark:text-indigo-300 shadow-xs">
                    🔍 Detección Automática de Adendas
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-indigo-950/80 border border-slate-200 dark:border-indigo-500/30 text-slate-800 dark:text-indigo-300 shadow-xs">
                    📊 Matriz de Requisitos Estructurada
                  </span>
                </div>
              </div>

              {/* Preview Box Capa 2 */}
              <div className="w-full lg:w-80 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-indigo-500/40 p-6 space-y-4 shadow-inner">
                <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                  REQUISITOS EXTRAÍDOS DEL PLIEGO
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 shadow-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Índice de Liquidez</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">≥ 1.50</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 shadow-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Endeudamiento Máximo</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">≤ 70%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 shadow-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Experiencia RUP</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">800 SMMLV</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 3 TRACK (STICKY TOP-24, MAXIMUM ELEVATION CULMINATION)
        ========================================================================== */}
        <div ref={track3Ref} className="min-h-[85vh] relative">
          <div
            ref={card3Ref}
            className="sticky top-24 z-30 w-full rounded-[2.5rem] border-2 border-emerald-500/50 dark:border-emerald-400 bg-white dark:bg-slate-900/98 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.15),0_0_35px_rgba(16,185,129,0.25)] dark:shadow-[0_0_100px_rgba(52,211,153,0.6),0_40px_120px_rgba(0,0,0,1)] transition-all will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_25px_#10b981]" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Capa 03 · Matching Determinístico & Alistamiento</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Veredicto Inmediato de Postulación y Checklist SECOP II
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Compara tu RUP contra los requisitos extraídos. Genera veredictos inmediatos (RECOMMENDED, RISKY, NOT_RECOMMENDED), detecta causales de descarte y prepara el expediente de documentos para radicar sin errores.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-500/30 text-slate-800 dark:text-emerald-300 shadow-xs">
                    🎯 Score de Compatibilidad 0-100
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-500/30 text-slate-800 dark:text-emerald-300 shadow-xs">
                    ⚖️ Ponderación 40/40/20 Estricta
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-500/30 text-slate-800 dark:text-emerald-300 shadow-xs">
                    📦 Expediente ZIP Listo para SECOP II
                  </span>
                </div>
              </div>

              {/* Preview Box Capa 3 */}
              <div className="w-full lg:w-80 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-emerald-400/50 p-6 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-600 dark:text-slate-400">SCORE FINAL</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-xl drop-shadow-sm">88.5 / 100</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-center text-xs flex items-center justify-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>POSTULACIÓN RECOMENDADA</span>
                </div>
                <div className="pt-2 text-center">
                  <button
                    onClick={onEnterDashboard}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <span>Ver Expediente Completo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default StackedCards;
