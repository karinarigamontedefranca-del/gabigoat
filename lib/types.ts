export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  theme: "default" | "vitor" | "rafael";
  created_at: string;
}

export type Stage = "lead" | "contato" | "proposta" | "negociacao" | "ganho" | "perdido";
export type Priority = "baixa" | "media" | "alta";
export type CompanyStatus = "aberto" | "ganho" | "perdido";
export type InteractionType = "whatsapp" | "email" | "ligacao" | "reuniao" | "outro";

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

export const STAGES: { key: Stage; label: string }[] = [
  { key: "lead", label: "Novo lead" },
  { key: "contato", label: "Em contato" },
  { key: "proposta", label: "Proposta enviada" },
  { key: "negociacao", label: "Negociação" },
  { key: "ganho", label: "Fechado (ganho)" },
  { key: "perdido", label: "Perdido" },
];

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
