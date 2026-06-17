"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Trophy, Layers, ArrowRight, CalendarDays, MapPin } from "lucide-react";

type EventBanner = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string | null;
  image_url: string | null;
  action_url: string | null;
  action_label: string | null;
};

type Album = {
  id: string;
  name: string;
  theme: string | null;
  year: number | null;
  total_stickers: number | null;
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

export default function Albums() {
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [eventBanner, setEventBanner] = useState<EventBanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAlbums() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: activeAlbums, error } = await supabase
        .from("albums")
        .select("*")
        .eq("active", true);

      const { data: activeEvents, error: eventsError } = await supabase
        .from("events")
        .select("id,title,description,location,starts_at,image_url,action_url,action_label")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(1);

      if (error) {
        console.error("Error loading albums", error);
      } else if (activeAlbums) {
        setAlbums(activeAlbums);
      }

      if (eventsError) {
        console.error("Error loading events", eventsError);
      } else {
        setEventBanner(activeEvents?.[0] ?? null);
      }
      setLoading(false);
    }

    loadAlbums();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Carregando álbuns...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {eventBanner && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-white/5">
            <div className="grid gap-0 md:grid-cols-[1.3fr_0.7fr]">
              <div className="p-6 sm:p-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Evento em destaque
                </div>
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  {eventBanner.title}
                </h2>
                {eventBanner.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                    {eventBanner.description}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-zinc-300">
                  {formatEventDate(eventBanner.starts_at) && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-2">
                      <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                      {formatEventDate(eventBanner.starts_at)}
                    </span>
                  )}
                  {eventBanner.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-2">
                      <MapPin className="h-4 w-4 text-[var(--accent)]" />
                      {eventBanner.location}
                    </span>
                  )}
                </div>
                {eventBanner.action_url && (
                  <Link
                    href={eventBanner.action_url}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
                  >
                    {eventBanner.action_label || "Ver evento"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <div className="min-h-48 bg-gradient-to-br from-[var(--primary)]/25 via-black/10 to-[var(--accent)]/20 md:min-h-full">
                {eventBanner.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={eventBanner.image_url}
                    alt=""
                    className="h-full min-h-48 w-full object-cover"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Escolha um Álbum</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Selecione o álbum que você está colecionando no momento para começar a organizar e trocar figurinhas.
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <Trophy className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="font-bold text-white text-lg">Nenhum Álbum Ativo</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Atualmente não existem álbuns ativos cadastrados no sistema.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="glass p-6 rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="h-11 w-11 flex items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-2 py-0.5 rounded">
                      {album.theme}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-xl group-hover:text-[var(--primary)] transition-colors">
                    {album.name}
                  </h3>
                  
                  {album.year && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Ano de Lançamento: {album.year}
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-2 text-zinc-500 text-xs">
                    <Layers className="h-4 w-4 text-zinc-400" />
                    <span>{album.total_stickers} Figurinhas no Álbum</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href={`/album/${album.id}`}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Gerenciar Coleção
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <Link
                      href={`/album/${album.id}/missing`}
                      className="py-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                    >
                      Faltantes
                    </Link>
                    <Link
                      href={`/album/${album.id}/duplicates`}
                      className="py-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                    >
                      Repetidas
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
