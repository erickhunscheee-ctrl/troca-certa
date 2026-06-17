"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showErrorToast } from "@/lib/toast";
import Navbar from "@/components/Navbar";

export default function Register() {
  const cityOptions = ["Roca Sales", "Encantado", "Muçum", "Dois Lajeados", "Guaporé"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getErrorMessage = (err: unknown, fallback: string) => {
    return err instanceof Error ? err.message : fallback;
  };

  const showError = (message: string) => {
    setError(message);
    showErrorToast(message);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password || !name || !city || !state) {
      showError("Por favor, preencha todos os campos obrigatorios.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            city,
            state,
          },
        },
      });

      if (signUpError) {
        showError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push("/albums");
      }
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Ocorreu um erro ao tentar criar a conta."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/albums`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Ocorreu um erro ao conectar com Google."));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="glass relative z-10 w-full max-w-md rounded-2xl border border-[var(--border-color)] p-8">
          <h2 className="mb-2 text-center text-3xl font-bold text-white">Criar Conta</h2>
          <p className="mb-6 text-center text-sm text-zinc-400">
            Cadastre-se para comecar a colecionar e trocar
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Erick Hunsche"
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  UF
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-center text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: seu@email.com"
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-2.5 text-sm text-white transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full cursor-pointer rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] py-3 text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/10 transition-all hover:scale-[1.01] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Registrar"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-950 px-2 text-zinc-400">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Google
          </button>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Ja tem uma conta?{" "}
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
