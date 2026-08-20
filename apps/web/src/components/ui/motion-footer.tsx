import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, FileCheck, ArrowUpRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: color-mix(in oklch, var(--foreground, #0f172a) 4%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground, #0f172a) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background, #ffffff) 60%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground, #0f172a) 12%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background, #ffffff) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground, #0f172a) 10%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, #2563eb 15%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, #2563eb 5%, transparent);
  --pill-border-hover: color-mix(in oklch, #2563eb 45%, transparent);
  --pill-shadow-hover: color-mix(in oklch, #2563eb 25%, transparent);
  --pill-highlight-hover: color-mix(in oklch, #2563eb 35%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.85; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(37, 99, 235, 0.6)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 12px rgba(37, 99, 235, 0.9)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.footer-bg-grid {
  background-size: 50px 50px;
  background-image: 
    linear-gradient(to right, color-mix(in oklch, var(--foreground, #0f172a) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground, #0f172a) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(37, 99, 235, 0.12) 0%, 
    rgba(59, 130, 246, 0.06) 40%, 
    transparent 70%
  );
}

.dark .footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(37, 99, 235, 0.28) 0%, 
    rgba(59, 130, 246, 0.18) 40%, 
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
}

.footer-giant-bg-text {
  font-size: 24vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(15, 23, 42, 0.05);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.dark .footer-giant-bg-text {
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 4px 20px rgba(37, 99, 235, 0.12));
}

.dark .footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 28px rgba(59, 130, 246, 0.45));
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.12,
            rotationY: x * 0.12,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.35,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.1,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer select-none", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Monitoreo SECOP I & II</span> <span className="text-blue-600 dark:text-blue-400">✦</span>
    <span>Lectura de Pliegos con IA</span> <span className="text-blue-500">✦</span>
    <span>Matching RUP y UNSPSC</span> <span className="text-blue-600 dark:text-blue-400">✦</span>
    <span>Score Financiero & Jurídico</span> <span className="text-blue-500">✦</span>
    <span>Checklist de Postulación</span> <span className="text-blue-600 dark:text-blue-400">✦</span>
  </div>
);

interface CinematicFooterProps {
  onEnterApp?: () => void;
  onOpenAuth?: () => void;
}

export function CinematicFooter({ onEnterApp, onOpenAuth }: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "12vh", scale: 0.85, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 45%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 cinematic-footer-wrapper transition-colors duration-200">
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            LICITIA
          </div>

          <div className="absolute top-10 left-0 w-full overflow-hidden border-y border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 z-10 -rotate-1 scale-105 shadow-md">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.25em] text-slate-600 dark:text-slate-300 uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-16 w-full max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 dark:border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              IA Especializada en Contratación Pública
            </div>

            <h2
              ref={headingRef}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_35px_rgba(37,99,235,0.4)]"
            >
              ¿Listo para ganar más <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300">
                licitaciones con menos esfuerzo?
              </span>
            </h2>

            <p className="text-slate-600 dark:text-slate-200 text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed text-center">
              No leas pliegos interminables. Descubre en segundos si tu empresa cumple financieramente, jurídicamente y por experiencia RUP antes de postularte.
            </p>

            <div ref={linksRef} className="flex flex-col items-center gap-5 w-full">
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  onClick={onEnterApp}
                  className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-sm sm:text-base flex items-center gap-3 group bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30"
                >
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                
                <MagneticButton
                  onClick={onOpenAuth}
                  className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-5 rounded-full text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white font-bold text-sm sm:text-base flex items-center gap-3 group border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Crear Cuenta / Probar Gratis</span>
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-6">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] md:text-xs font-semibold tracking-wider uppercase order-2 md:order-1">
              © 2026 LicitIA. Hecho para empresas en Colombia.
            </div>

            <div className="px-5 py-2.5 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-[11px] md:text-xs shadow-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Potenciado con</span>
              <span className="animate-footer-heartbeat text-sm text-blue-600 dark:text-blue-400">✦</span>
              <span className="text-slate-900 dark:text-white font-bold">Modelos de IA & Datos Abiertos</span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              title="Volver arriba"
              className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white group order-3 shadow-xs"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
