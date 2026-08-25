"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // sobe a barra de progresso suavemente até 100%
    const start = Date.now();
    const duration = 1900;

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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-pasture">
      <div className="relative flex items-center justify-center mb-8">
        {/* anéis pulsando atrás da logo, como um brasão ganhando vida */}
        <span className="absolute w-40 h-40 rounded-full border border-lime/20 animate-ping-slow" />
        <span className="absolute w-52 h-52 rounded-full border border-horn/10 animate-ping-slower" />

        <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-glow animate-logo-in">
          <Image src="/logo.png" alt="GabiGoat Lab" fill className="object-cover" priority />
        </div>
      </div>

      <p className="font-display font-semibold text-lg text-cream mb-1 animate-fade-in">
        GabiGoat Lab
      </p>
      <p className="font-mono text-xs text-muted mb-6 animate-fade-in">
        preparando o rebanho…
      </p>

      <div className="w-48 h-1.5 rounded-full bg-pasture-lighter overflow-hidden border border-pasture-border">
        <div
          className="h-full bg-lime rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
