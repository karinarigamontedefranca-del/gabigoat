"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import GoatMark from "@/components/GoatMark";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      router.replace("/");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("Conta criada! Verifique seu e-mail para confirmar (ou já pode entrar, se a confirmação estiver desativada).");
      setMode("login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <GoatMark className="w-14 h-14 mb-3" />
          <h1 className="font-display font-bold text-2xl">GabiGoat Lab</h1>
          <p className="text-muted text-sm mt-1">funil de vendas sob controle</p>
        </div>

        <div className="card p-6">
          <div className="flex mb-6 rounded-lg bg-pasture p-1 border border-pasture-border">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-lime text-pasture font-semibold" : "text-muted"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "signup" ? "bg-lime text-pasture font-semibold" : "text-muted"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gabi@exemplo.com"
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {info && <p className="text-sm text-ok">{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
