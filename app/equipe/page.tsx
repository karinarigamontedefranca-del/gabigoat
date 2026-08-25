"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { Company, INTERACTION_TYPES, Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function EquipePage() {
  return (
    <AuthGuard>
      <AppShell>
        <Equipe />
      </AppShell>
    </AuthGuard>
  );
}

type InteractionRow = {
  id: string;
  user_id: string;
  company_id: string;
  type: string;
  note: string | null;
  created_at: string;
  companies: { id: string; name: string } | null;
};

function Equipe() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: i }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("companies").select("*"),
      supabase
        .from("interactions")
        .select("*, companies(id, name)")
        .order("created_at", { ascending: false }),
    ]);
    setProfiles((p as Profile[]) ?? []);
    setCompanies(c ?? []);
    setInteractions((i as unknown as InteractionRow[]) ?? []);
    setLoading(false);
  }

  const perProfile = useMemo(() => {
    return profiles.map((profile) => {
      const myCompanies = companies.filter((c) => c.user_id === profile.id);
      const myInteractions = interactions.filter((it) => it.user_id === profile.id);
      const won = myCompanies.filter((c) => c.stage === "ganho").length;
      return {
        profile,
        companiesCount: myCompanies.length,
        interactionsCount: myInteractions.length,
        wonCount: won,
        recent: myInteractions.slice(0, 5),
      };
    });
  }, [profiles, companies, interactions]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">Equipe</h1>
        <p className="text-muted text-sm">quem tá cuidando de quê no funil</p>
      </header>

      {loading ? (
        <p className="text-muted font-mono text-sm">carregando…</p>
      ) : profiles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">
            Nenhum perfil encontrado ainda. Assim que as contas da equipe forem criadas e
            fizerem login pela primeira vez, elas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {perProfile.map(({ profile, companiesCount, interactionsCount, wonCount, recent }) => (
            <div key={profile.id} className="card p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-pasture-border shrink-0">
                  <Image
                    src={profile.avatar_url || "/logo.png"}
                    alt={profile.display_name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-display font-semibold text-base leading-tight">
                    {profile.display_name}
                  </p>
                  <p className="text-xs text-muted">membro da equipe</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <Stat label="Empresas" value={companiesCount} />
                <Stat label="Contatos" value={interactionsCount} />
                <Stat label="Fechados" value={wonCount} accent />
              </div>

              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Atividade recente
              </p>
              {recent.length === 0 ? (
                <p className="text-sm text-muted">Nenhum contato registrado ainda.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recent.map((it) => {
                    const label = INTERACTION_TYPES.find((t) => t.key === it.type)?.label ?? it.type;
                    return (
                      <li key={it.id} className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          {it.companies ? (
                            <Link
                              href={`/empresas/${it.companies.id}`}
                              className="text-cream hover:text-lime font-medium truncate"
                            >
                              {it.companies.name}
                            </Link>
                          ) : (
                            <span className="text-cream">—</span>
                          )}
                          <span className="text-muted font-mono whitespace-nowrap">
                            {formatDateTime(it.created_at)}
                          </span>
                        </div>
                        <span className="text-muted">{label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-pasture border border-pasture-border p-2.5 text-center">
      <p className={`font-display font-bold text-lg scoreboard-number ${accent ? "text-lime" : "text-cream"}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
    </div>
  );
}
