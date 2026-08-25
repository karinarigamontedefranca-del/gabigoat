import { Priority } from "@/lib/types";
import { daysSince, streakLabel, streakLevel } from "@/lib/utils";

export function StreakBadge({ lastContactAt }: { lastContactAt: string | null }) {
  const days = daysSince(lastContactAt);
  const level = streakLevel(days);
  const styles = {
    ok: "bg-ok/10 text-ok border-ok/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    danger: "bg-danger/10 text-danger border-danger/30",
  }[level];

  const dot = { ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" }[level];

  return (
    <span className={`chip border scoreboard-number ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {streakLabel(days)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    alta: "bg-danger/10 text-danger border-danger/30",
    media: "bg-horn/10 text-horn border-horn/30",
    baixa: "bg-muted/10 text-muted border-muted/30",
  };
  const label: Record<Priority, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
  return <span className={`chip border ${styles[priority]}`}>{label[priority]}</span>;
}
