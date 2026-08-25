"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { FUNNEL_STAGES, FunnelTarget, StageEvent } from "@/lib/types";
import {
  buildAvgTransitionTimes,
  buildFunnelSteps,
  buildWeeklyLeads,
  filterEventsByRange,
  findBottleneck,
} from "@/lib/funnel";

export default function RelatorioPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Relatorio />
      </AppShell>
    </AuthGuard>
  );
}

const PERIOD_OPTIONS = [
  { key: 7, label: "7 dias" },
  { key: 30, label: "30 dias" },
  { key: 90, label: "90 dias" },
  { key: 0, label: "Tudo" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoKey(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return d.toISOString().slice(0, 10);
}

function Relatorio() {
  const [events, setEvents] = useState<StageEvent[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: e }, { data: t }] = await Promise.all([
      supabase.from("stage_events").select("*"),
      supabase.from("funnel_targets").select("*"),
    ]);
    setEvents((e as StageEvent[]) ?? []);
    const map: Record<string, number> = {};
    ((t as FunnelTarget[]) ?? []).forEach((row) => (map[row.stage] = row.target_pct));
    setTargets(map);
    setLoading(false);
  }

  async function saveTarget(stage: string, value: number) {
    setTargets((prev) => ({ ...prev, [stage]: value }));
    await supabase.from("funnel_targets").upsert({ stage, target_pct: value }, { onConflict: "stage" });
  }

  const filteredEvents = useMemo(() => {
    if (period === 0) return events;
    return filterEventsByRange(events, daysAgoKey(period), todayKey());
  }, [events, period]);

  const funnelSteps = useMemo(() => buildFunnelSteps(filteredEvents), [filteredEvents]);
  const bottleneck = useMemo(() => findBottleneck(funnelSteps), [funnelSteps]);
  const weekly = useMemo(() => buildWeeklyLeads(events, 8), [events]);
  const transitions = useMemo(() => buildAvgTransitionTimes(events), [events]);

  const leadsCount = funnelSteps[0]?.count ?? 0;
  const contratoCount = funnelSteps[funnelSteps.length - 1]?.count ?? 0;
  const overallPct = leadsCount > 0 ? (contratoCount / leadsCount) * 100 : 0;
  const maxWeekly = Math.max(...weekly.map((w) => w.count), 1);
  const maxTransitionDays = Math.max(...transitions.map((t) => t.avgDays ?? 0), 1);

  const periodLabel =
    period === 0 ? "em todo o período" : `nos últimos ${period} dias`;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Relatório</h1>
          <p className="text-muted text-sm">o que os números do funil estão dizendo</p>
        </div>
        <div className="flex rounded-lg border border-pasture-border bg-pasture-light overflow-hidden">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.key ? "bg-lime text-pasture" : "text-muted hover:text-cream"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando…</p>
      ) : leadsCount === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">
            Ainda não há leads registrados {periodLabel}. Assim que o funil tiver movimento, o
            relatório aparece aqui sozinho. 🐐
          </p>
        </div>
      ) : (
        <>
          {/* resumo em texto, tipo um parágrafo de análise */}
          <div className="card p-6 mb-6">
            <p className="text-sm text-cream/90 leading-relaxed">
              {periodLabel === "em todo o período" ? "Em todo o período registrado" : `Nos últimos ${period} dias`},{" "}
              <span className="text-lime font-semibold">{leadsCount}</span>{" "}
              {leadsCount === 1 ? "lead entrou" : "leads entraram"} no funil, e{" "}
              <span className="text-lime font-semibold">{contratoCount}</span>{" "}
              {contratoCount === 1 ? "virou" : "viraram"} contrato assinado — uma conversão geral de{" "}
              <span className="text-lime font-semibold">{overallPct.toFixed(1)}%</span>.
              {bottleneck && (
                <>
                  {" "}
                  O maior gargalo está entre{" "}
                  <span className="text-danger font-semibold">
                    {FUNNEL_STAGES[FUNNEL_STAGES.findIndex((s) => s.key === bottleneck.stage) - 1]?.label}
                  </span>{" "}
                  e <span className="text-danger font-semibold">{bottleneck.label}</span>, com apenas{" "}
                  <span className="text-danger font-semibold">{bottleneck.pctOfPrevious.toFixed(0)}%</span>{" "}
                  de conversão nessa passagem.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* tendencia semanal de leads */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-base mb-5">Leads por semana</h2>
              <div className="flex items-end gap-2 h-32">
                {weekly.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-muted font-mono">{w.count || ""}</span>
                    <div
                      className="w-full bg-lime/70 rounded-t"
                      style={{ height: `${Math.max((w.count / maxWeekly) * 100, w.count > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[9px] text-muted font-mono">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* tempo medio entre fases */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-base mb-5">Tempo médio até avançar</h2>
              {transitions.every((t) => t.avgDays === null) ? (
                <p className="text-sm text-muted">
                  Ainda não há empresas suficientes que passaram por duas fases seguidas.
                </p>
              ) : (
                <div className="space-y-3">
                  {transitions.map((t) => (
                    <div key={t.toStage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted truncate pr-2">
                          {t.fromLabel} → {t.toLabel}
                        </span>
                        <span className="text-cream font-mono whitespace-nowrap">
                          {t.avgDays !== null ? `${t.avgDays.toFixed(1)}d` : "—"}
                          {t.sampleSize > 0 && (
                            <span className="text-muted"> ({t.sampleSize})</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-pasture overflow-hidden">
                        <div
                          className="h-full rounded-full bg-horn/70"
                          style={{
                            width: `${t.avgDays !== null ? Math.max((t.avgDays / maxTransitionDays) * 100, 4) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* tabela de conversao com metas editaveis */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-semibold text-base">Conversão por fase</h2>
            </div>
            <p className="text-xs text-muted mb-5">
              defina a taxa ideal de cada passagem — o relatório aponta quando a realidade está
              abaixo da meta
            </p>

            <div className="space-y-4">
              {funnelSteps.map((step, i) => {
                if (i === 0) return null; // lead é a base, não tem "conversão da fase anterior"
                const target = targets[step.stage] ?? 0;
                const hasTarget = target > 0;
                const isBelow = hasTarget && step.pctOfPrevious < target;
                return (
                  <div key={step.stage} className="flex items-center gap-4">
                    <div className="w-44 shrink-0 text-sm text-cream truncate">{step.label}</div>
                    <div className="flex-1 h-2 rounded-full bg-pasture overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isBelow ? "bg-danger/70" : "bg-lime/70"}`}
                        style={{ width: `${Math.min(step.pctOfPrevious, 100)}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <span
                        className={`text-sm font-mono font-semibold ${isBelow ? "text-danger" : "text-lime"}`}
                      >
                        {step.pctOfPrevious.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-28 shrink-0 flex items-center gap-1.5 text-xs text-muted">
                      meta
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={target || ""}
                        placeholder="—"
                        onBlur={(e) => saveTarget(step.stage, Number(e.target.value) || 0)}
                        className="w-14 bg-pasture border border-pasture-border rounded px-1.5 py-1 text-cream text-xs focus:border-lime/50 focus:outline-none"
                      />
                      %
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
