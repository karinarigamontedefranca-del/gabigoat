"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { INTERACTION_TYPES, InteractionType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  companyId: string;
}

export default function InteractionModal({ open, onClose, onSaved, companyId }: Props) {
  const [type, setType] = useState<InteractionType>("whatsapp");
  const [note, setNote] = useState("");
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

    const { error } = await supabase.from("interactions").insert({
      company_id: companyId,
      user_id: user.id,
      type,
      note: note.trim() || null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNote("");
    setType("whatsapp");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Registrar contato</h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tipo de contato</label>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                    type === t.key
                      ? "bg-lime/10 border-lime/40 text-lime"
                      : "bg-pasture border-pasture-border text-muted hover:text-cream"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">O que foi conversado (opcional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: mandei orçamento, ela disse que vai avaliar..."
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
