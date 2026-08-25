"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, INTERACTION_TYPES, Interaction, STAGES, Task } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, whatsappLink } from "@/lib/utils";
import { StreakBadge, PriorityBadge } from "@/components/Badges";
import CompanyModal from "@/components/CompanyModal";
import InteractionModal from "@/components/InteractionModal";
import TaskModal from "@/components/TaskModal";
import MessageGeneratorModal from "@/components/MessageGeneratorModal";

export default function CompanyDetailPage() {
  return (
    <AuthGuard>
      <AppShell>
        <CompanyDetail />
      </AppShell>
    </AuthGuard>
  );
}

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: ints }, { data: t }] = await Promise.all([
      supabase.from("companies").select("*").eq("id", id).single(),
      supabase
        .from("interactions")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("company_id", id)
        .order("done", { ascending: true })
        .order("due_date", { ascending: true }),
    ]);
    setCompany(c ?? null);
    setInteractions(ints ?? []);
    setTasks(t ?? []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!company) return;
    if (!confirm(`Excluir "${company.name}"? Isso também apaga o histórico de contatos.`)) return;
    await supabase.from("companies").delete().eq("id", company.id);
    router.push("/empresas");
  }

  async function toggleTask(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
  }

  if (loading) return <p className="text-muted font-mono text-sm">carregando…</p>;
  if (!company) return <p className="text-muted text-sm">Empresa não encontrada.</p>;

  const link = whatsappLink(company.whatsapp);
  const stageLabel = STAGES.find((s) => s.key === company.stage)?.label ?? company.stage;

  return (
    <div>
      <Link href="/empresas" className="text-sm text-muted hover:text-cream mb-4 inline-block">
        ← Voltar para empresas
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="font-display font-bold text-3xl">{company.name}</h1>
            <PriorityBadge priority={company.priority} />
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <StreakBadge lastContactAt={company.last_contact_at} />
            <span className="text-muted">·</span>
            <span className="text-muted">{stageLabel}</span>
            {company.segment && (
              <>
                <span className="text-muted">·</span>
                <span className="text-muted">{company.segment}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMessageOpen(true)} className="btn-primary">
            ✨ Gerar mensagem
          </button>
          <button onClick={() => setContactOpen(true)} className="btn-secondary">
            + Registrar contato
          </button>
          <button onClick={() => setEditOpen(true)} className="btn-secondary">
            Editar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* linha do tempo */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-base mb-5">Histórico de contatos</h2>
            {interactions.length === 0 ? (
              <p className="text-sm text-muted">Nenhum contato registrado ainda.</p>
            ) : (
              <ol className="relative border-l border-pasture-border ml-2 space-y-6">
                {interactions.map((it) => {
                  const label = INTERACTION_TYPES.find((t) => t.key === it.type)?.label ?? it.type;
                  return (
                    <li key={it.id} className="ml-5">
                      <span className="absolute -translate-x-[calc(1.25rem+1px)] mt-1.5 w-2.5 h-2.5 rounded-full bg-lime" />
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="chip bg-pasture border border-pasture-border text-cream text-xs">
                          {label}
                        </span>
                        <span className="text-xs text-muted font-mono">{formatDateTime(it.created_at)}</span>
                      </div>
                      {it.note && <p className="text-sm text-cream/90">{it.note}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {company.notes && (
            <div className="card p-6">
              <h2 className="font-display font-semibold text-base mb-3">Notas</h2>
              <p className="text-sm text-cream/90 whitespace-pre-wrap">{company.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* dados de contato */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-base mb-4">Dados</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Contato">{company.contact_person || "—"}</Row>
              <Row label="WhatsApp">
                {link ? (
                  <a href={link} target="_blank" rel="noreferrer" className="text-ok hover:underline">
                    {company.whatsapp}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="E-mail">{company.email || "—"}</Row>
              <Row label="Origem">{company.source || "—"}</Row>
              <Row label="Valor estimado">{formatCurrency(company.value)}</Row>
              <Row label="Cliente desde">{formatDate(company.created_at)}</Row>
            </dl>
          </div>

          {/* tarefas relacionadas */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base">Follow-ups</h2>
              <button onClick={() => setTaskOpen(true)} className="text-xs text-lime hover:underline">
                + adicionar
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted">Nenhum follow-up agendado.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t)}
                      className="mt-0.5 accent-lime"
                    />
                    <span className={t.done ? "line-through text-muted" : "text-cream"}>
                      {t.title}
                      {t.due_date && (
                        <span className="text-muted font-mono text-xs ml-2">{formatDate(t.due_date)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={handleDelete} className="text-xs text-danger hover:underline">
            Excluir empresa
          </button>
        </div>
      </div>

      <MessageGeneratorModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        company={company}
      />
      <CompanyModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} company={company} />
      <InteractionModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onSaved={load}
        companyId={company.id}
      />
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onSaved={load}
        companies={[company]}
        defaultCompanyId={company.id}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-cream/90">{children}</dd>
    </div>
  );
}
