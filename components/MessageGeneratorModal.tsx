"use client";

import { useEffect, useMemo, useState } from "react";
import { Company } from "@/lib/types";
import { whatsappLink } from "@/lib/utils";
import { detectSituation, generateMessages, SITUATIONS, Situation } from "@/lib/messageTemplates";

interface Props {
  open: boolean;
  onClose: () => void;
  company: Company;
}

export default function MessageGeneratorModal({ open, onClose, company }: Props) {
  const autoSituation = useMemo(() => detectSituation(company), [company]);
  const [situation, setSituation] = useState<Situation>(autoSituation);
  const [variantIndex, setVariantIndex] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const variants = useMemo(() => generateMessages(company, situation), [company, situation]);

  useEffect(() => {
    if (open) {
      setSituation(autoSituation);
      setVariantIndex(0);
      setCopied(false);
    }
  }, [open, autoSituation]);

  useEffect(() => {
    setText(variants[variantIndex] ?? variants[0] ?? "");
  }, [variants, variantIndex]);

  if (!open) return null;

  const link = whatsappLink(company.whatsapp);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenWhatsapp() {
    if (!link) return;
    window.open(`${link}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            ✨ Gerar mensagem
          </h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-xs text-muted mb-5">para {company.name}</p>

        <div className="mb-4">
          <label className="label">Situação</label>
          <select
            className="input"
            value={situation}
            onChange={(e) => {
              setSituation(e.target.value as Situation);
              setVariantIndex(0);
            }}
          >
            {SITUATIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
                {s.key === autoSituation ? " (sugerido)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Escolha um tom</label>
          </div>
          <div className="flex gap-2">
            {variants.map((_, i) => (
              <button
                key={i}
                onClick={() => setVariantIndex(i)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  variantIndex === i
                    ? "bg-lime/10 border-lime/40 text-lime"
                    : "bg-pasture border-pasture-border text-muted hover:text-cream"
                }`}
              >
                Opção {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <label className="label">Mensagem (pode editar à vontade)</label>
          <textarea
            className="input min-h-[140px] resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {!company.whatsapp && (
          <p className="text-xs text-warn mb-2">
            Essa empresa não tem WhatsApp cadastrado — você pode copiar a mensagem e enviar por outro canal.
          </p>
        )}

        <div className="flex gap-3 pt-3">
          <button type="button" onClick={handleCopy} className="btn-secondary flex-1">
            {copied ? "Copiado! ✓" : "Copiar mensagem"}
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsapp}
            disabled={!link}
            className="btn-primary flex-1"
          >
            Abrir no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
