"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // sobe a barra de progresso suavemente até 100%
    const start = Date.now();
    const duration = 2600;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 250);
      }
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-pasture overflow-hidden">
      {/* brilho de fundo sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,77,0.06),transparent_60%)]" />

      <div className="relative flex items-center justify-center mb-10">
        {/* anel giratório em degradê, tipo um brasão sendo "forjado" */}
        <span className="absolute w-72 h-72 rounded-full animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0%,rgba(200,255,77,0.35)_15%,transparent_30%,transparent_50%,rgba(232,169,76,0.3)_65%,transparent_80%)]" />
        <span className="absolute w-72 h-72 rounded-full bg-pasture" style={{ clipPath: "circle(46% at 50% 50%)" }} />

        {/* anéis pulsando */}
        <span className="absolute w-56 h-56 rounded-full border border-lime/20 animate-ping-slow" />
        <span className="absolute w-64 h-64 rounded-full border border-horn/10 animate-ping-slower" />
        <span className="absolute w-72 h-72 rounded-full border border-lime/5 animate-ping-slowest" />

        {/* faíscas girando ao redor */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-lime animate-sparkle"
            style={
              {
                top: "50%",
                left: "50%",
                "--r": `${i * 60}deg`,
                animationDelay: `${i * 0.35}s`,
              } as React.CSSProperties
            }
          />
        ))}

        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-glow animate-logo-in animate-float">
          <Image src="/logo.png" alt="GabiGoat Lab" fill className="object-cover" priority sizes="256px" />
        </div>
      </div>

      <p className="font-display font-bold text-2xl text-cream mb-1.5 animate-fade-in">
        GabiGoat Lab
      </p>
      <p className="font-mono text-xs text-muted mb-7 animate-fade-in tracking-wide">
        preparando o rebanho…
      </p>

      <div className="w-56 h-1.5 rounded-full bg-pasture-lighter overflow-hidden border border-pasture-border relative">
        <div
          className="h-full bg-lime rounded-full transition-[width] duration-150 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
