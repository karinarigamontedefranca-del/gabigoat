"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company, STAGES } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  companies: Company[];
}

export default function StageEventModal({ open, onClose, onSaved, companies }: Props) {
  const [companyId, setCompanyId] = useState("");
  const [stage, setStage] = useState("lead");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) {
      setError("Escolha uma empresa.");
      return;
    }
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada, entre novamente.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("stage_events").insert({
      user_id: user.id,
      company_id: companyId,
      stage,
      occurred_at: date,
      note: note.trim() || null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCompanyId("");
    setStage("lead");
    setNote("");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg">Registrar evento no funil</h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-xs text-muted mb-5">
          Use isso pra lançar manualmente algo que aconteceu fora do kanban (ex: registrar
          retroativamente, ou uma fase que passou batida).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Empresa *</label>
            <select className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Selecione…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fase</label>
              <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Comentário (opcional)</label>
            <textarea
              className="input min-h-[70px] resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: respondeu no mesmo dia, mas não agendou reunião ainda"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
