"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, StageEvent } from "@/lib/types";
import { buildDailyGrid, buildFunnelSteps } from "@/lib/funnel";
import { formatDate } from "@/lib/utils";
import StageEventModal from "@/components/StageEventModal";

export default function FunilPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Funil />
      </AppShell>
    </AuthGuard>
  );
}

const RANGE_OPTIONS = [
  { key: 14, label: "14 dias" },
  { key: 30, label: "30 dias" },
  { key: 60, label: "60 dias" },
];

function Funil() {
  const [events, setEvents] = useState<(StageEvent & { companies: { name: string } | null })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"visual" | "planilha">("visual");
  const [rangeDays, setRangeDays] = useState(30);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase
        .from("stage_events")
        .select("*, companies(name)")
        .order("occurred_at", { ascending: false }),
      supabase.from("companies").select("*").order("name"),
    ]);
    setEvents((e as typeof events) ?? []);
    setCompanies(c ?? []);
    setLoading(false);
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Remover esse evento do funil?")) return;
    await supabase.from("stage_events").delete().eq("id", id);
    load();
  }

  const funnelSteps = useMemo(() => buildFunnelSteps(events), [events]);
  const grid = useMemo(() => buildDailyGrid(events, rangeDays), [events, rangeDays]);
  const maxCount = Math.max(...funnelSteps.map((s) => s.count), 1);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Funil</h1>
          <p className="text-muted text-sm">
            calculado automaticamente a partir do que acontece no{" "}
            <Link href="/empresas" className="text-lime hover:underline">
              kanban de empresas
            </Link>
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Registrar evento
        </button>
      </header>

      <div className="flex rounded-lg border border-pasture-border bg-pasture-light overflow-hidden w-fit mb-6">
        <button
          onClick={() => setView("visual")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "visual" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
          }`}
        >
          Funil visual
        </button>
        <button
          onClick={() => setView("planilha")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "planilha" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
          }`}
        >
          Planilha
        </button>
      </div>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando…</p>
      ) : view === "visual" ? (
        <VisualFunnel steps={funnelSteps} maxCount={maxCount} />
      ) : (
        <PlanilhaView
          grid={grid}
          rangeDays={rangeDays}
          setRangeDays={setRangeDays}
          events={events}
          onDelete={handleDeleteEvent}
        />
      )}

      <StageEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        companies={companies}
      />
    </div>
  );
}

function VisualFunnel({
  steps,
  maxCount,
}: {
  steps: ReturnType<typeof buildFunnelSteps>;
  maxCount: number;
}) {
  if (steps.every((s) => s.count === 0)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted text-sm">
          Ainda não há dados suficientes. Assim que empresas forem avançando no kanban, o funil
          aparece aqui sozinho. 🐐
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, step.count > 0 ? 6 : 0) : 0;
          return (
            <div key={step.stage}>
              <div className="flex items-center gap-4">
                <div className="w-44 shrink-0 text-sm text-cream text-right">{step.label}</div>
                <div className="flex-1 h-10 rounded-lg bg-pasture overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-lime/70 to-lime rounded-lg flex items-center px-3 transition-all"
                    style={{ width: `${widthPct}%` }}
                  >
                    {step.count > 0 && (
                      <span className="font-display font-bold text-pasture text-sm scoreboard-number whitespace-nowrap">
                        {step.count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-32 shrink-0 text-right">
                  <span className="text-xs font-mono text-lime">{step.pctOfLead.toFixed(0)}% do lead</span>
                </div>
              </div>
              {i > 0 && (
                <div className="pl-48 mt-1 mb-1">
                  <span className="text-[11px] text-muted font-mono">
                    ↳ {step.pctOfPrevious.toFixed(0)}% converteu da fase anterior
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanilhaView({
  grid,
  rangeDays,
  setRangeDays,
  events,
  onDelete,
}: {
  grid: ReturnType<typeof buildDailyGrid>;
  rangeDays: number;
  setRangeDays: (n: number) => void;
  events: (StageEvent & { companies: { name: string } | null })[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="card p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display font-semibold text-base">Planilha do funil</h2>
          <div className="flex rounded-lg border border-pasture-border bg-pasture overflow-hidden">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeDays(r.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  rangeDays === r.key ? "bg-lime text-pasture" : "text-muted hover:text-cream"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <table className="text-sm border-collapse min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 bg-pasture-light text-left px-3 py-2 text-xs text-muted uppercase tracking-wide border-b border-pasture-border">
                Fase
              </th>
              {grid.dateLabels.map((label, i) => (
                <th
                  key={i}
                  className="px-2 py-2 text-xs text-muted font-mono border-b border-pasture-border text-center min-w-[40px]"
                >
                  {label}
                </th>
              ))}
              <th className="px-3 py-2 text-xs text-lime uppercase tracking-wide border-b border-pasture-border text-center">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.stage} className="border-b border-pasture-border/50">
                <td className="sticky left-0 bg-pasture-light px-3 py-2 text-cream whitespace-nowrap">
                  {row.label}
                </td>
                {row.counts.map((c, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 text-center font-mono text-xs ${
                      c > 0 ? "text-cream" : "text-muted/40"
                    }`}
                  >
                    {c > 0 ? c : "·"}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-mono text-sm text-lime font-semibold">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-base mb-4">Eventos recentes</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-pasture-border">
            {events.slice(0, 20).map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="text-cream truncate">
                    <span className="font-medium">{ev.companies?.name ?? "empresa removida"}</span>
                    <span className="text-muted"> · {ev.stage}</span>
                  </p>
                  {ev.note && <p className="text-xs text-muted truncate">{ev.note}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted font-mono">{formatDate(ev.occurred_at)}</span>
                  <button
                    onClick={() => onDelete(ev.id)}
                    className="text-muted hover:text-danger text-xs"
                  >
                    remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
