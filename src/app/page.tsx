"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Coins, Zap, ShieldCheck, MessageSquare, ArrowRight, Sparkles, CalendarDays, MapPin } from "lucide-react";

type HomeEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string | null;
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
        .select("id,title,description,location,starts_at,action_url,action_label")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(3);

      if (error) {
        console.error("Error loading events", error);
        return;
      }

      setEvents(data ?? []);
    }

    loadEvents();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-sm animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Plataforma inteligente para colecionadores</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-3xl leading-tight">
            Colecione, encontre matches e{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] via-indigo-400 to-[var(--accent)] bg-clip-text text-transparent">
              complete seu álbum
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
            O **Troca Certa** ajuda você a cruzar as suas figurinhas repetidas com as que você precisa. Negocie em tempo real com outros colecionadores.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.03] active:scale-95"
            >
              Começar a trocar
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors backdrop-blur-sm"
            >
              Entrar na minha conta
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl w-full text-left">
            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]">
                <Coins className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Álbum Inteligente</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Adicione suas figurinhas e veja na hora o que tem, o que falta e o que tem repetido.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
                <Zap className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Matchmaking Real</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Encontre usuários que precisam do que você tem repetido e que têm o que você precisa.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <MessageSquare className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Chat em Tempo Real</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Negocie os detalhes da troca e combine o ponto de encontro com o chat do Supabase Realtime.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Troca Segura</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Confirme e conclua a troca diretamente no sistema para atualizar automaticamente os inventários.
              </p>
            </div>
          </div>

          {events.length > 0 && (
            <section className="mt-16 w-full max-w-5xl text-left">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Eventos de troca</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Encontros ativos para acelerar sua colecao.
                  </p>
                </div>
                <Link
                  href="/albums"
                  className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:bg-white/10 sm:inline-flex"
                >
                  Participar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{event.title}</h3>
                    {event.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-col gap-2 text-xs text-zinc-400">
                      {formatEventDate(event.starts_at) && (
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-[var(--primary)]" />
                          {formatEventDate(event.starts_at)}
                        </span>
                      )}
                      {event.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.action_url && (
                      <Link
                        href={event.action_url}
                        className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        {event.action_label || "Ver detalhes"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500 bg-black/40">
        <p>© 2026 Troca Certa. Feito para colecionadores da Copa do Mundo 2026 e muito mais.</p>
      </footer>
    </div>
  );
}
