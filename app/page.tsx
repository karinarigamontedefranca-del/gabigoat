"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, STAGES, Task } from "@/lib/types";
import { daysSince, formatCurrency, formatDate, streakLevel } from "@/lib/utils";
import { StreakBadge, PriorityBadge } from "@/components/Badges";
import GoatMark from "@/components/GoatMark";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Dashboard />
      </AppShell>
    </AuthGuard>
  );
}

function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("companies").select("*").order("last_contact_at", { ascending: true }),
      supabase.from("tasks").select("*").eq("done", false).order("due_date", { ascending: true }),
    ]);
    setCompanies(c ?? []);
    setTasks(t ?? []);
    setLoading(false);
  }

  const openDeals = companies.filter((c) => c.status === "aberto");
  const pipelineValue = openDeals.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const wonThisMonth = companies.filter((c) => {
    if (c.stage !== "ganho") return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const stale = useMemo(
    () =>
      openDeals
        .map((c) => ({ c, days: daysSince(c.last_contact_at) ?? 999 }))
        .filter((x) => streakLevel(x.days) !== "ok")
        .sort((a, b) => b.days - a.days)
        .slice(0, 6),
    [openDeals]
  );

  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: openDeals.filter((c) => c.stage === s.key).length,
  }));

  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-muted text-sm mb-1 font-mono">{greeting}, Gabi 🐐</p>
          <h1 className="font-display font-bold text-3xl">Painel comercial</h1>
        </div>
        <Link href="/empresas" className="btn-primary">
          + Nova empresa
        </Link>
      </header>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando dados…</p>
      ) : (
        <>
          {/* metricas principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Pipeline em aberto" value={formatCurrency(pipelineValue)} accent="lime" />
            <MetricCard label="Empresas no funil" value={String(openDeals.length)} accent="horn" />
            <MetricCard label="Precisam de atenção" value={String(stale.length)} accent="danger" />
            <MetricCard label="Fechados este mês" value={String(wonThisMonth.length)} accent="ok" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* funil por estagio */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display font-semibold text-base mb-5">Funil por estágio</h2>
              <div className="space-y-3">
                {stageCounts.map((s) => {
                  const max = Math.max(...stageCounts.map((x) => x.count), 1);
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted">{s.label}</span>
                        <span className="scoreboard-number text-cream">{s.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-pasture overflow-hidden">
                        <div
                          className="h-full rounded-full bg-lime/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* proximos follow ups */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-base">Próximos follow-ups</h2>
                <Link href="/tarefas" className="text-xs text-lime hover:underline">
                  ver todos
                </Link>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted">Nenhum follow-up pendente. 🎉</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.slice(0, 6).map((t) => (
                    <li key={t.id} className="text-sm flex justify-between gap-2">
                      <span className="text-cream">{t.title}</span>
                      <span className="text-muted font-mono text-xs whitespace-nowrap">
                        {formatDate(t.due_date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* empresas esfriando */}
          <div className="card p-6 mt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-base">Esfriando — precisa falar logo</h2>
              <Link href="/empresas" className="text-xs text-lime hover:underline">
                ver todas as empresas
              </Link>
            </div>
            {stale.length === 0 ? (
              <p className="text-sm text-muted">Tudo em dia! Nenhuma empresa esfriando. 🔥</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stale.map(({ c }) => (
                  <Link
                    href={`/empresas/${c.id}`}
                    key={c.id}
                    className="rounded-xl border border-pasture-border bg-pasture p-4 hover:border-lime/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm truncate">{c.name}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <StreakBadge lastContactAt={c.last_contact_at} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "lime" | "horn" | "danger" | "ok";
}) {
  const colors = {
    lime: "text-lime",
    horn: "text-horn",
    danger: "text-danger",
    ok: "text-ok",
  };
  return (
    <div className="card p-5">
      <p className="text-muted text-xs uppercase tracking-wide font-medium mb-2">{label}</p>
      <p className={`font-display font-bold text-2xl scoreboard-number ${colors[accent]}`}>{value}</p>
    </div>
  );
}
