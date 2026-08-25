"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getTheme } from "@/lib/themes";

interface Props {
  onDone: () => void;
  avatarUrl?: string | null;
  displayName?: string | null;
  theme?: string | null;
}

export default function LoadingScreen({ onDone, avatarUrl, displayName, theme }: Props) {
  const [progress, setProgress] = useState(0);
  const t = getTheme(theme);
  const src = avatarUrl || "/logo.png";
  const name = displayName || "GabiGoat Lab";

  // partículas subindo tipo confete, posições/delay determinísticos
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 137.5) % 100, // espalhado tipo phyllotaxis, parece aleatório mas é estável
        delay: (i % 7) * 0.35,
        duration: 3.2 + (i % 5) * 0.4,
        size: i % 3 === 0 ? 5 : i % 3 === 1 ? 3 : 4,
        gold: i % 2 === 0,
      })),
    []
  );

  useEffect(() => {
    const start = Date.now();
    const duration = 3800;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 300);
      }
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-pasture overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,77,0.06),transparent_60%)]" />

      {/* partículas subindo do fundo */}
      {particles.map((p, i) => (
        <span
          key={i}
          className={`absolute bottom-0 rounded-full animate-particle-rise ${
            p.gold ? "bg-horn/70" : t.accentSoft
          }`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div className="relative flex items-center justify-center mb-10">
        {/* halo pulsante atrás de tudo */}
        <span className={`absolute w-80 h-80 rounded-full ${t.glowSoft} animate-glow-pulse blur-2xl`} />

        {/* anel giratório em degradê */}
        <span className={`absolute w-72 h-72 rounded-full animate-spin-slow ${t.conic}`} />
        <span
          className="absolute w-72 h-72 rounded-full bg-pasture"
          style={{ clipPath: "circle(46% at 50% 50%)" }}
        />

        {/* anel giratório reverso, mais fino, por cima */}
        <span
          className={`absolute w-60 h-60 rounded-full border-2 border-dashed ${t.ring1} animate-spin-reverse`}
        />

        {/* ondas pulsando */}
        <span className={`absolute w-56 h-56 rounded-full border ${t.ring1} animate-ping-slow`} />
        <span className={`absolute w-64 h-64 rounded-full border ${t.ring2} animate-ping-slower`} />
        <span className={`absolute w-72 h-72 rounded-full border ${t.ring3} animate-ping-slowest`} />

        {/* faíscas orbitando */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className={`absolute rounded-full ${i % 2 === 0 ? t.accentBg : "bg-horn"} animate-sparkle`}
            style={
              {
                top: "50%",
                left: "50%",
                width: i % 2 === 0 ? 6 : 4,
                height: i % 2 === 0 ? 6 : 4,
                "--r": `${i * 45}deg`,
                animationDelay: `${i * 0.25}s`,
              } as React.CSSProperties
            }
          />
        ))}

        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-glow animate-logo-entrance">
          <Image src={src} alt={name} fill className="object-cover" priority sizes="256px" />
        </div>
      </div>

      <p className="font-display font-bold text-2xl text-cream mb-1.5 flex">
        {name.split("").map((char, i) => (
          <span
            key={i}
            className="inline-block animate-letter-bounce"
            style={{ animationDelay: `${1.1 + i * 0.045}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </p>
      <p className="font-mono text-xs text-muted mb-7 animate-fade-in tracking-wide">
        {t.greeting}
      </p>

      <div className="w-56 h-1.5 rounded-full bg-pasture-lighter overflow-hidden border border-pasture-border relative">
        <div
          className={`h-full ${t.accentBg} rounded-full transition-[width] duration-150 ease-out relative overflow-hidden`}
          style={{ width: `${progress}%` }}
        >
          <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
