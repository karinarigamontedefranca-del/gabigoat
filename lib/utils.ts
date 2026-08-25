export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  return diff < 0 ? 0 : diff;
}

export function streakLabel(days: number | null): string {
  if (days === null) return "sem contato";
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

// Define a "temperatura" do contato: verde = fresco, amarelo = atenção, vermelho = esfriando
export function streakLevel(days: number | null): "ok" | "warn" | "danger" {
  if (days === null) return "danger";
  if (days <= 3) return "ok";
  if (days <= 7) return "warn";
  return "danger";
}

export function formatCurrency(value: number | null): string {
  const v = value ?? 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Monta link direto de whatsapp a partir do numero digitado (com ou sem formatação)
export function whatsappLink(raw: string | null): string | null {
  if (!raw) return null;
  const digits = onlyDigits(raw);
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
