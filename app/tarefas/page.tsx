"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import TaskModal from "@/components/TaskModal";

export default function TarefasPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Tarefas />
      </AppShell>
    </AuthGuard>
  );
}

type TaskWithCompany = Task & { companies: { id: string; name: string } | null };

function Tarefas() {
  const [tasks, setTasks] = useState<TaskWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"pendentes" | "todas">("pendentes");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, companies(id, name)")
        .order("done", { ascending: true })
        .order("due_date", { ascending: true }),
      supabase.from("companies").select("*").order("name"),
    ]);
    setTasks((t as TaskWithCompany[]) ?? []);
    setCompanies(c ?? []);
    setLoading(false);
  }

  async function toggleTask(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
  }

  async function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  const visible = useMemo(
    () => (filter === "pendentes" ? tasks.filter((t) => !t.done) : tasks),
    [tasks, filter]
  );

  const overdue = (t: Task) => t.due_date && !t.done && new Date(t.due_date) < new Date(new Date().toDateString());

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Follow-ups</h1>
          <p className="text-muted text-sm">{tasks.filter((t) => !t.done).length} pendentes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Novo follow-up
        </button>
      </header>

      <div className="flex rounded-lg border border-pasture-border bg-pasture-light overflow-hidden w-fit mb-6">
        <button
          onClick={() => setFilter("pendentes")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "pendentes" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter("todas")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "todas" ? "bg-lime text-pasture" : "text-muted hover:text-cream"
          }`}
        >
          Todas
        </button>
      </div>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando…</p>
      ) : visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">Nenhum follow-up por aqui. Hora de prospectar! 🐐</p>
        </div>
      ) : (
        <div className="card divide-y divide-pasture-border">
          {visible.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-4">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t)}
                className="accent-lime w-4 h-4"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.done ? "line-through text-muted" : "text-cream"}`}>{t.title}</p>
                {t.companies && (
                  <Link
                    href={`/empresas/${t.companies.id}`}
                    className="text-xs text-lime hover:underline"
                  >
                    {t.companies.name}
                  </Link>
                )}
              </div>
              {t.due_date && (
                <span className={`text-xs font-mono ${overdue(t) ? "text-danger" : "text-muted"}`}>
                  {formatDate(t.due_date)}
                </span>
              )}
              <button onClick={() => removeTask(t.id)} className="text-muted hover:text-danger text-sm">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} companies={companies} />
    </div>
  );
}
