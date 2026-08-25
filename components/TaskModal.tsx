"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  companies: Company[];
  defaultCompanyId?: string;
}

export default function TaskModal({ open, onClose, onSaved, companies, defaultCompanyId }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      company_id: companyId || null,
      title: title.trim(),
      due_date: dueDate || null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setDueDate("");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Novo follow-up</h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">O que precisa fazer *</label>
            <input
              required
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: mandar proposta atualizada"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Empresa (opcional)</label>
              <select
                className="input"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Nenhuma</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Salvando…" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
