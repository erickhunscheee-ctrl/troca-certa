"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { showErrorToast } from "@/lib/toast";
import Navbar from "@/components/Navbar";

export default function Profile() {
  const cityOptions = ["Roca Sales", "Encantado", "Muçum", "Dois Lajeados", "Guaporé"];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [favoriteTheme, setFavoriteTheme] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const showError = (message: string) => {
    setError(message);
    showErrorToast(message);
  };

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        showError("Nao foi possivel carregar as informacoes do perfil.");
      } else if (profile) {
        setName(profile.name || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setWhatsapp(profile.whatsapp || "");
        setFavoriteTheme(profile.favorite_theme || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    if (!name || !city || !state) {
      showError("Nome, cidade e estado sao obrigatorios.");
      setSaving(false);
      return;
    }

    if (!user) {
      showError("Sessao nao encontrada. Entre novamente para salvar o perfil.");
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          city,
          state,
          whatsapp: whatsapp || null,
          favorite_theme: favoriteTheme || null,
        })
        .eq("id", user.id);

      if (updateError) {
        showError(updateError.message);
      } else {
        setSuccess("Perfil atualizado com sucesso!");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Ocorreu um erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-sm text-zinc-400">Carregando perfil...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="relative mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="glass relative z-10 rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold text-white">Meu Perfil</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Mantenha suas informacoes atualizadas para facilitar as trocas
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-600">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Cidade
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                >
                  <option value="" disabled>
                    Selecione uma cidade
                  </option>
                  {cityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  UF
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-center text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                WhatsApp (opcional)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <span className="mt-1 block text-[10px] text-zinc-500">
                O WhatsApp sera compartilhado somente apos voce aceitar uma solicitacao de troca.
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Colecao ou tema favorito (opcional)
              </label>
              <input
                type="text"
                value={favoriteTheme}
                onChange={(e) => setFavoriteTheme(e.target.value)}
                placeholder="Ex: Futebol, Copa do Mundo, Animes"
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full cursor-pointer rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] py-3 text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/10 transition-all hover:scale-[1.01] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
