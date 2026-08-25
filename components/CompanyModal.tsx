"use client";

import { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company, PRIORITIES, STAGES } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  company?: Company | null;
}

const empty = {
  name: "",
  contact_person: "",
  whatsapp: "",
  email: "",
  segment: "",
  source: "",
  stage: "lead",
  priority: "media",
  value: "",
  notes: "",
};

export default function CompanyModal({ open, onClose, onSaved, company }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        contact_person: company.contact_person ?? "",
        whatsapp: company.whatsapp ?? "",
        email: company.email ?? "",
        segment: company.segment ?? "",
        source: company.source ?? "",
        stage: company.stage,
        priority: company.priority,
        value: company.value ? String(company.value) : "",
        notes: company.notes ?? "",
      });
    } else {
      setForm(empty);
    }
    setError(null);
  }, [company, open]);

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

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      segment: form.segment.trim() || null,
      source: form.source.trim() || null,
      stage: form.stage,
      priority: form.priority,
      value: form.value ? Number(form.value) : 0,
      notes: form.notes.trim() || null,
      user_id: user.id,
    };

    let err;
    if (company) {
      const { error } = await supabase.from("companies").update(payload).eq("id", company.id);
      err = error;
    } else {
      const { error } = await supabase.from("companies").insert(payload);
      err = error;
    }

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">
            {company ? "Editar empresa" : "Nova empresa"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome da empresa *</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Padaria Bom Pão"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pessoa de contato</label>
              <input
                className="input"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input
                className="input"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="(31) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
            <div>
              <label className="label">Segmento</label>
              <input
                className="input"
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                placeholder="Ex: Varejo, Estética..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Origem do lead</label>
              <input
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Indicação, Instagram..."
              />
            </div>
            <div>
              <label className="label">Valor estimado (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estágio do funil</label>
              <select
                className="input"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Qualquer detalhe importante sobre essa empresa..."
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
