"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [favoriteTheme, setFavoriteTheme] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

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
        setError("Não foi possível carregar as informações do perfil.");
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
      setError("Nome, Cidade e Estado são obrigatórios.");
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
        setError(updateError.message);
      } else {
        setSuccess("Perfil atualizado com sucesso!");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Carregando perfil...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="glass rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Meu Perfil</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Mantenha suas informações atualizadas para facilitar as trocas
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  UF / Estado
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--border-color)] text-white text-sm text-center focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                WhatsApp (Opcional - Não aparece publicamente)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                O WhatsApp será compartilhado somente após você aceitar uma solicitação de troca com outro usuário.
              </span>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Coleção ou Tema Favorito (Opcional)
              </label>
              <input
                type="text"
                value={favoriteTheme}
                onChange={(e) => setFavoriteTheme(e.target.value)}
                placeholder="Ex: Futebol, Copa do Mundo, Animes"
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
