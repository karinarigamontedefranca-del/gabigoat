import { FUNNEL_STAGES, Stage, StageEvent } from "./types";

export interface DailyGridRow {
  stage: Stage;
  label: string;
  counts: number[];
  total: number;
}

export interface DailyGrid {
  dateKeys: string[]; // YYYY-MM-DD
  dateLabels: string[]; // DD/MM
  rows: DailyGridRow[];
}

// monta a grade estilo planilha: uma linha por fase, uma coluna por dia
export function buildDailyGrid(events: StageEvent[], days: number): DailyGrid {
  const dateKeys: string[] = [];
  const dateLabels: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dateKeys.push(key);
    dateLabels.push(
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    );
  }

  const rows: DailyGridRow[] = FUNNEL_STAGES.map((s) => {
    const counts = dateKeys.map(
      (key) => events.filter((e) => e.stage === s.key && e.occurred_at === key).length
    );
    return {
      stage: s.key,
      label: s.label,
      counts,
      total: counts.reduce((a, b) => a + b, 0),
    };
  });

  // linha extra de "perdido", fora da contagem principal do funil
  const perdidoCounts = dateKeys.map(
    (key) => events.filter((e) => e.stage === "perdido" && e.occurred_at === key).length
  );
  rows.push({
    stage: "perdido",
    label: "Perdido",
    counts: perdidoCounts,
    total: perdidoCounts.reduce((a, b) => a + b, 0),
  });

  return { dateKeys, dateLabels, rows };
}

export interface FunnelStep {
  stage: Stage;
  label: string;
  count: number; // empresas distintas que já passaram por essa fase, no período
  pctOfLead: number; // % em relação ao total de leads
  pctOfPrevious: number; // % em relação à fase anterior (taxa de conversão do "degrau")
}

// calcula quantas empresas distintas alcançaram cada fase (funil clássico, indo de largo pra estreito)
export function buildFunnelSteps(events: StageEvent[]): FunnelStep[] {
  const steps: FunnelStep[] = FUNNEL_STAGES.map((s) => {
    const companies = new Set(events.filter((e) => e.stage === s.key).map((e) => e.company_id));
    return { stage: s.key, label: s.label, count: companies.size, pctOfLead: 0, pctOfPrevious: 0 };
  });

  const leadCount = steps[0]?.count || 0;

  return steps.map((step, i) => ({
    ...step,
    pctOfLead: leadCount > 0 ? (step.count / leadCount) * 100 : 0,
    pctOfPrevious: i === 0 ? 100 : steps[i - 1].count > 0 ? (step.count / steps[i - 1].count) * 100 : 0,
  }));
}

// filtra eventos por período (inclusive)
export function filterEventsByRange(
  events: StageEvent[],
  startKey: string | null,
  endKey: string | null
): StageEvent[] {
  if (!startKey && !endKey) return events;
  return events.filter((e) => {
    if (startKey && e.occurred_at < startKey) return false;
    if (endKey && e.occurred_at > endKey) return false;
    return true;
  });
}
