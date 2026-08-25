export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  theme: "default" | "vitor" | "rafael";
  created_at: string;
}

export type Stage =
  | "lead"
  | "conexao"
  | "apres_agendada"
  | "apres_realizada"
  | "proposta_agendada"
  | "proposta_realizada"
  | "contrato"
  | "perdido";
export type Priority = "baixa" | "media" | "alta";
export type CompanyStatus = "aberto" | "ganho" | "perdido";
export type InteractionType = "whatsapp" | "email" | "ligacao" | "reuniao" | "outro";

export interface StageEvent {
  id: string;
  user_id: string;
  company_id: string;
  stage: Stage;
  occurred_at: string; // date (YYYY-MM-DD)
  note: string | null;
  created_at: string;
}

export interface FunnelTarget {
  stage: Stage;
  target_pct: number;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  contact_person: string | null;
  whatsapp: string | null;
  email: string | null;
  segment: string | null;
  source: string | null;
  stage: Stage;
  status: CompanyStatus;
  value: number | null;
  priority: Priority;
  notes: string | null;
  created_at: string;
  last_contact_at: string | null;
}

export interface Interaction {
  id: string;
  user_id: string;
  company_id: string;
  type: InteractionType;
  note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

export const STAGES: { key: Stage; label: string; short: string }[] = [
  { key: "lead", label: "Lead", short: "Lead" },
  { key: "conexao", label: "Conexão", short: "Conexão" },
  { key: "apres_agendada", label: "Apresentação agendada", short: "Apr. agendada" },
  { key: "apres_realizada", label: "Apresentação realizada", short: "Apr. realizada" },
  { key: "proposta_agendada", label: "Proposta agendada", short: "Prop. agendada" },
  { key: "proposta_realizada", label: "Proposta realizada", short: "Prop. realizada" },
  { key: "contrato", label: "Contrato assinado", short: "Contrato" },
  { key: "perdido", label: "Perdido", short: "Perdido" },
];

// as 7 fases que entram na contagem do funil/planilha (perdido fica de fora,
// é tratado como "saída" do funil, não como progresso)
export const FUNNEL_STAGES = STAGES.filter((s) => s.key !== "perdido");

export const PRIORITIES: { key: Priority; label: string }[] = [
  { key: "alta", label: "Alta" },
  { key: "media", label: "Média" },
  { key: "baixa", label: "Baixa" },
];

export const INTERACTION_TYPES: { key: InteractionType; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "ligacao", label: "Ligação" },
  { key: "reuniao", label: "Reunião" },
  { key: "outro", label: "Outro" },
];
