"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { showErrorToast } from "@/lib/toast";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Coins,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type HomeEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string | null;
  image_url: string | null;
  action_url: string | null;
  action_label: string | null;
};

function formatEventDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [events, setEvents] = useState<HomeEvent[]>([]);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,description,location,starts_at,image_url,action_url,action_label")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(3);

      if (error) {
        console.error("Error loading events", error);
        showErrorToast("Nao foi possivel carregar os eventos de troca.");
        return;
      }

      setEvents(data ?? []);
    }

    loadEvents();
  }, []);

  const featuredEvent = events[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="relative flex-1 overflow-hidden">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 py-10 text-center sm:px-6 lg:px-8">
          <section className="w-full overflow-hidden rounded-[2rem] bg-[var(--brand-navy)] shadow-2xl shadow-[var(--brand-navy)]/15">
            <div className="grid items-stretch lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col items-start p-8 text-left sm:p-12 lg:p-14">


                <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-[#ffffff] sm:text-6xl">
                  Troque. Complete. Celebre.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg">
                  Troca Certa conecta colecionadores para organizar figurinhas,
                  encontrar matches e fechar trocas com seguranca.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-[var(--accent)]"
                  >
                    Comecar a trocar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/20 bg-white px-6 py-3.5 text-base font-bold text-[var(--brand-navy)] transition-colors hover:bg-blue-50"
                  >
                    Entrar na minha conta
                  </Link>
                </div>
              </div>

              <div className="flex min-h-[360px] items-center justify-center bg-[#eef4ff] p-8">
                <div className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white p-4 text-left shadow-2xl">
                  <div className="rounded-2xl bg-[var(--brand-navy)] p-5 text-[#ffffff]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                        Album
                      </span>
                      <span className="rounded-full bg-[var(--warning)] px-2 py-1 text-xs font-extrabold text-[var(--brand-navy)]">
                        2026
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-extrabold text-[#ffffff]">
                      Copa 2026
                    </h2>
                    <p className="mt-1 text-sm text-blue-100">
                      Sua colecao. Suas trocas. Suas conquistas.
                    </p>
                    <div className="mt-6 h-2 rounded-full bg-white/15">
                      <div className="h-full w-7/12 rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[var(--border-color)] bg-[#f8fafc] p-4">
                      <p className="text-xs font-bold text-[var(--brand-slate)]">
                        Minhas figurinhas
                      </p>
                      <p className="mt-2 text-xl font-extrabold text-[var(--primary)]">
                        312 / 680
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-color)] bg-[#f8fafc] p-4">
                      <p className="text-xs font-bold text-[var(--brand-slate)]">
                        Quero trocar
                      </p>
                      <p className="mt-2 text-xl font-extrabold text-[var(--accent)]">
                        24
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[#f8fafc] p-4">
                    <div className="flex items-center gap-3">
                      <span className="relative block h-10 w-12 shrink-0">
                        <span className="absolute left-0 top-1 flex h-8 w-8 rotate-[-10deg] items-center justify-center rounded-lg bg-[var(--brand-navy)] text-white">
                          <RefreshCw className="h-4 w-4" />
                        </span>
                        <span className="absolute right-0 top-1 flex h-8 w-8 rotate-[10deg] items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      </span>
                      <div>
                        <p className="text-sm font-extrabold text-[var(--brand-navy)]">
                          Trocas ativas
                        </p>
                        <p className="text-xs font-medium text-[var(--brand-slate)]">
                          1 nova solicitacao
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {featuredEvent && (
            <section className="mt-8 w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-[var(--border-color)] bg-white text-left shadow-2xl shadow-[var(--brand-navy)]/10">
              <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Evento em destaque
                  </div>

                  <h2 className="max-w-3xl text-2xl font-extrabold text-white sm:text-3xl">
                    {featuredEvent.title}
                  </h2>

                  {featuredEvent.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                      {featuredEvent.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
                    {formatEventDate(featuredEvent.starts_at) && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[#f8fafc] px-3 py-2">
                        <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                        {formatEventDate(featuredEvent.starts_at)}
                      </span>
                    )}
                    {featuredEvent.location && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[#f8fafc] px-3 py-2">
                        <MapPin className="h-4 w-4 text-[var(--accent)]" />
                        {featuredEvent.location}
                      </span>
                    )}
                  </div>

                  <Link
                    href={featuredEvent.action_url || "/albums"}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-navy)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--brand-navy)]/10 transition-colors hover:bg-[var(--primary)]"
                  >
                    {featuredEvent.action_label || "Ver evento"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative min-h-[220px] bg-[var(--brand-navy)] lg:min-h-full">
                  {featuredEvent.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredEvent.image_url}
                      alt=""
                      className="h-full min-h-[220px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center bg-[var(--brand-navy)] p-8">
                      <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-8 text-center text-[#ffffff]">
                        <CalendarDays className="mx-auto h-12 w-12 text-[var(--warning)]" />
                        <p className="mt-4 text-sm font-extrabold uppercase tracking-wider text-[#ffffff]">
                          Troque. Complete. Celebre.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass flex flex-col gap-3 rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
                <Coins className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-white">Album inteligente</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Controle o que tem, o que falta e o que esta repetido.
              </p>
            </div>

            <div className="glass flex flex-col gap-3 rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                <Zap className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-white">Matches reais</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Encontre quem precisa do que voce tem e oferece o que voce busca.
              </p>
            </div>

            <div className="glass flex flex-col gap-3 rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning)]">
                <MessageSquare className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-white">Chat direto</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Combine detalhes da troca e mantenha tudo registrado.
              </p>
            </div>

            <div className="glass flex flex-col gap-3 rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/10 text-[#ff7a00]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-white">Troca segura</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Conclua a troca e atualize automaticamente os inventarios.
              </p>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-[var(--border-color)] bg-white/75 py-8 text-center text-xs font-medium text-zinc-500">
        <p>(c) 2026 Troca Certa. Feito para colecionadores da Copa do Mundo 2026 e muito mais.</p>
      </footer>
    </div>
  );
}
