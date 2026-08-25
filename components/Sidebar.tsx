"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import GoatMark from "./GoatMark";

const NAV = [
  { href: "/", label: "Painel", icon: "◆" },
  { href: "/empresas", label: "Empresas", icon: "▤" },
  { href: "/tarefas", label: "Follow-ups", icon: "✓" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="w-64 shrink-0 border-r border-pasture-border bg-pasture-light/40 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2.5 border-b border-pasture-border">
        <GoatMark className="w-8 h-8 goat-mark" />
        <div>
          <div className="font-display font-bold text-lg leading-none">GabiGoat</div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-lime uppercase">Lab</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-lime/10 text-lime border border-lime/20"
                  : "text-muted hover:text-cream hover:bg-pasture-lighter border border-transparent"
              }`}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-pasture-border">
        <button onClick={handleLogout} className="btn-ghost w-full justify-start">
          ← Sair
        </button>
      </div>
    </aside>
  );
}
