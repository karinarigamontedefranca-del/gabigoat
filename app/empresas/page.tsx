"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, STAGES, Stage } from "@/lib/types";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import { StreakBadge, PriorityBadge } from "@/components/Badges";
import CompanyModal from "@/components/CompanyModal";
import MessageGeneratorModal from "@/components/MessageGeneratorModal";

export default function EmpresasPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Empresas />
      </AppShell>
    </AuthGuard>
  );
}

function Empresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [messagingFor, setMessagingFor] = useState<Company | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies(data ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact_person?.toLowerCase().includes(q) ||
        c.segment?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setModalOpen(true);
  }

  async function moveStage(companyId: string, stage: Stage) {
    const status = stage === "contrato" ? "ganho" : stage === "perdido" ? "perdido" : "aberto";
    setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, stage, status } : c)));
    await supabase.from("companies").update({ stage, status }).eq("id", companyId);
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Empresas</h1>
          <p className="text-muted text-sm">
            {companies.length} no total · {companies.filter((c) => c.status === "aberto").length} em negociação
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          + Nova empresa
        </button>
      </header>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nome, contato, segmento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex rounded-lg border border-pasture-border bg-pasture-light overflow-hidden">
          <button
            onClick={() => setView("kanban")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "kanban" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("lista")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "lista" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando…</p>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = filtered.filter((c) => c.stage === stage.key);
            const value = items.reduce((s, c) => s + (c.value ?? 0), 0);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.key);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveStage(id, stage.key);
                  setDragOverStage(null);
                }}
                className={`w-72 shrink-0 rounded-2xl border p-3 transition-colors ${
                  dragOverStage === stage.key
                    ? "border-lime/50 bg-lime/5"
                    : "border-pasture-border bg-pasture-light/40"
                }`}
              >
                <div className="flex items-center justify-between px-1 mb-3">
                  <h3 className="font-display font-semibold text-sm">{stage.short}</h3>
                  <span className="text-xs text-muted font-mono">{items.length}</span>
                </div>
                <p className="px-1 text-xs text-muted font-mono mb-3">{formatCurrency(value)}</p>

                <div className="space-y-2 min-h-[40px]">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      className="relative group"
                    >
                      <Link
                        href={`/empresas/${c.id}`}
                        className="block card p-3 hover:border-lime/40 cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium text-sm leading-tight">{c.name}</span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                        {c.value ? (
                          <p className="text-xs text-lime font-mono mb-2">{formatCurrency(c.value)}</p>
                        ) : null}
                        <StreakBadge lastContactAt={c.last_contact_at} />
                      </Link>
                      <button
                        onClick={() => setMessagingFor(c)}
                        title="Gerar mensagem"
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md bg-pasture-lighter border border-pasture-border hover:border-lime/40 hover:text-lime text-xs flex items-center justify-center"
                      >
                        ✨
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-pasture-border text-muted text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Estágio</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Último contato</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const link = whatsappLink(c.whatsapp);
                const stageLabel = STAGES.find((s) => s.key === c.stage)?.label ?? c.stage;
                return (
                  <tr key={c.id} className="border-b border-pasture-border last:border-0 hover:bg-pasture-lighter/40">
                    <td className="px-4 py-3">
                      <Link href={`/empresas/${c.id}`} className="font-medium hover:text-lime transition-colors">
                        {c.name}
                      </Link>
                      {c.contact_person && <p className="text-xs text-muted">{c.contact_person}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ok hover:underline font-mono text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.whatsapp}
                        </a>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{stageLabel}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.value)}</td>
                    <td className="px-4 py-3">
                      <StreakBadge lastContactAt={c.last_contact_at} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setMessagingFor(c)} className="btn-ghost">
                        ✨ Mensagem
                      </button>
                      <button onClick={() => openEdit(c)} className="btn-ghost">
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted text-sm">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        company={editing}
      />
      {messagingFor && (
        <MessageGeneratorModal
          open={!!messagingFor}
          onClose={() => setMessagingFor(null)}
          company={messagingFor}
        />
      )}
    </div>
  );
}
