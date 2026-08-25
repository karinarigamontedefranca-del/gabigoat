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

// acha o "degrau" com a pior taxa de conversão — é o gargalo do funil
export function findBottleneck(steps: FunnelStep[]): FunnelStep | null {
  const candidates = steps.filter((_, i) => i > 0 && steps[i - 1].count >= 3); // exige uma amostra mínima
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, s) => (s.pctOfPrevious < worst.pctOfPrevious ? s : worst));
}

export interface WeekBucket {
  label: string; // ex: "11/08"
  count: number;
}

// quantidade de novos leads por semana, últimas N semanas
export function buildWeeklyLeads(events: StageEvent[], weeks = 8): WeekBucket[] {
  const leadEvents = events.filter((e) => e.stage === "lead");
  const today = new Date();
  const buckets: WeekBucket[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);
    const count = leadEvents.filter((e) => e.occurred_at >= startKey && e.occurred_at <= endKey).length;
    buckets.push({
      label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      count,
    });
  }
  return buckets;
}

export interface StageTransitionTime {
  fromStage: Stage;
  fromLabel: string;
  toStage: Stage;
  toLabel: string;
  avgDays: number | null;
  sampleSize: number;
}

// tempo médio (em dias) que as empresas levam pra ir de uma fase pra outra
export function buildAvgTransitionTimes(events: StageEvent[]): StageTransitionTime[] {
  // primeira data em que cada empresa alcançou cada fase
  const firstReached = new Map<string, Map<Stage, string>>();
  for (const e of events) {
    if (!firstReached.has(e.company_id)) firstReached.set(e.company_id, new Map());
    const companyMap = firstReached.get(e.company_id)!;
    const current = companyMap.get(e.stage);
    if (!current || e.occurred_at < current) {
      companyMap.set(e.stage, e.occurred_at);
    }
  }

  const results: StageTransitionTime[] = [];
  for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
    const from = FUNNEL_STAGES[i];
    const to = FUNNEL_STAGES[i + 1];
    const diffs: number[] = [];

    firstReached.forEach((companyMap) => {
      const fromDate = companyMap.get(from.key);
      const toDate = companyMap.get(to.key);
      if (fromDate && toDate) {
        const diff = Math.round(
          (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff >= 0) diffs.push(diff);
      }
    });

    results.push({
      fromStage: from.key,
      fromLabel: from.label,
      toStage: to.key,
      toLabel: to.label,
      avgDays: diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null,
      sampleSize: diffs.length,
    });
  }
  return results;
}
