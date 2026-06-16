"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Coins, CheckCircle, HelpCircle, Copy, AlertCircle, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  
  // Stats
  const [totalStickers, setTotalStickers] = useState(0);
  const [ownedCount, setOwnedCount] = useState(0);
  const [missingCount, setMissingCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  
  // Trade requests
  const [pendingTrades, setPendingTrades] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Load active albums
      const { data: activeAlbums, error: albumError } = await supabase
        .from("albums")
        .select("*")
        .eq("active", true);

      if (albumError || !activeAlbums) {
        console.error("Error loading albums", albumError);
        setLoading(false);
        return;
      }

      setAlbums(activeAlbums);
      
      const defaultAlbum = activeAlbums.find(
        (a) => a.id === "00000000-0000-0000-0000-000000002026"
      ) || activeAlbums[0];

      if (defaultAlbum) {
        setSelectedAlbum(defaultAlbum);
        await loadStats(defaultAlbum.id, session.user.id);
      }

      // Load pending trades
      const { data: trades, error: tradeError } = await supabase
        .from("trade_requests")
        .select(`
          id,
          status,
          created_at,
          sender:profiles!trade_requests_sender_id_fkey(name, city, state),
          receiver:profiles!trade_requests_receiver_id_fkey(name, city, state)
        `)
        .eq("status", "pending")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

      if (!tradeError && trades) {
        setPendingTrades(trades);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function loadStats(albumId: string, userId: string) {
    // 1. Get all stickers in album
    const { data: allStickers } = await supabase
      .from("stickers")
      .select("id")
      .eq("album_id", albumId);

    const total = allStickers?.length || 0;
    setTotalStickers(total);

    // 2. Get user stickers
    const { data: userStickers } = await supabase
      .from("user_stickers")
      .select("quantity, sticker_id, stickers!inner(album_id)")
      .eq("user_id", userId)
      .eq("stickers.album_id", albumId);

    const userStickerMap = new Map<string, number>();
    userStickers?.forEach((us) => {
      userStickerMap.set(us.sticker_id, us.quantity);
    });

    let owned = 0;
    let duplicates = 0;
    let missing = 0;

    allStickers?.forEach((s) => {
      const qty = userStickerMap.get(s.id) || 0;
      if (qty >= 1) {
        owned += 1;
        if (qty > 1) {
          duplicates += (qty - 1);
        }
      } else {
        missing += 1;
      }
    });

    setOwnedCount(owned);
    setDuplicateCount(duplicates);
    setMissingCount(missing);
  }

  const handleAlbumChange = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (album && user) {
      setSelectedAlbum(album);
      setLoading(true);
      await loadStats(album.id, user.id);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Carregando painel...</p>
        </main>
      </div>
    );
  }

  const progressPercent = totalStickers > 0 ? Math.round((ownedCount / totalStickers) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Meu Painel</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Acompanhe seu progresso e gerencie suas trocas
            </p>
          </div>

          {albums.length > 0 && selectedAlbum && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Álbum Ativo:
              </label>
              <select
                value={selectedAlbum.id}
                onChange={(e) => handleAlbumChange(e.target.value)}
                className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer"
              >
                {albums.map((album) => (
                  <option key={album.id} value={album.id} className="bg-zinc-900 text-white">
                    {album.name} ({album.year || "S/A"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedAlbum ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column (Sticker Inventory Stats) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Progress Card */}
              <div className="glass p-6 sm:p-8 rounded-2xl border border-[var(--border-color)]">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedAlbum.name}</h3>
                    <p className="text-xs text-zinc-400">Progresso do álbum</p>
                  </div>
                  <span className="text-3xl font-extrabold text-[var(--accent)]">{progressPercent}%</span>
                </div>

                <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                    <span className="text-2xl font-extrabold text-white">{totalStickers}</span>
                    <p className="text-xs text-zinc-500 mt-1">Total Álbum</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                    <span className="text-2xl font-extrabold text-emerald-400 flex justify-center items-center gap-1.5">
                      <CheckCircle className="h-5 w-5" />
                      {ownedCount}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Já Possuo</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                    <span className="text-2xl font-extrabold text-indigo-400 flex justify-center items-center gap-1.5">
                      <HelpCircle className="h-5 w-5" />
                      {missingCount}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Faltando</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                    <span className="text-2xl font-extrabold text-amber-400 flex justify-center items-center gap-1.5">
                      <Copy className="h-5 w-5" />
                      {duplicateCount}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Repetidas</p>
                  </div>
                </div>

                {/* Quick actions for inventory */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <Link
                    href={`/album/${selectedAlbum.id}`}
                    className="py-3 px-4 rounded-xl text-sm font-semibold text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  >
                    Gerenciar Inventário
                  </Link>
                  <Link
                    href={`/album/${selectedAlbum.id}/missing`}
                    className="py-3 px-4 rounded-xl text-sm font-semibold text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  >
                    Ver Faltantes
                  </Link>
                  <Link
                    href={`/album/${selectedAlbum.id}/duplicates`}
                    className="py-3 px-4 rounded-xl text-sm font-semibold text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  >
                    Ver Repetidas
                  </Link>
                </div>
              </div>

              {/* Matchmaking Promo card */}
              <div className="glass p-6 sm:p-8 rounded-2xl border border-[var(--border-color)] bg-gradient-to-br from-[var(--card-bg)] to-[var(--primary)]/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[var(--accent)]" />
                    Encontre Figurinhas Repetidas no seu Bairro
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1 max-w-lg">
                    Nosso sistema analisa os inventários e acha os colecionadores ideais para você realizar trocas bilaterais perfeitas.
                  </p>
                </div>
                <Link
                  href={`/album/${selectedAlbum.id}/matches`}
                  className="py-3 px-6 rounded-xl text-sm font-bold text-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:scale-[1.03] shrink-0"
                >
                  Oportunidades de Troca
                </Link>
              </div>
            </div>

            {/* Right Column (Pending Trades) */}
            <div className="flex flex-col gap-6">
              <div className="glass p-6 rounded-2xl border border-[var(--border-color)] flex-1">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[var(--primary)]" />
                  Solicitações Pendentes
                </h3>

                {pendingTrades.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-zinc-500 text-xs">Nenhuma solicitação pendente no momento.</p>
                    <Link
                      href={`/album/${selectedAlbum.id}/matches`}
                      className="text-xs text-[var(--primary)] hover:underline mt-2 font-medium"
                    >
                      Encontrar parceiros de troca →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {pendingTrades.map((trade) => {
                      const isSender = trade.sender.name !== user?.user_metadata?.name;
                      const partnerName = isSender ? trade.sender.name : trade.receiver.name;
                      const partnerLoc = isSender 
                        ? `${trade.sender.city} - ${trade.sender.state}`
                        : `${trade.receiver.city} - ${trade.receiver.state}`;
                      
                      return (
                        <div key={trade.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-zinc-300 font-bold text-sm block">{partnerName}</span>
                              <span className="text-[10px] text-zinc-500">{partnerLoc}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pendente
                            </span>
                          </div>
                          
                          <Link
                            href="/trades"
                            className="text-xs text-center font-semibold text-[var(--primary)] hover:underline mt-1 block"
                          >
                            Ver detalhes e responder
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-white/5 mt-6 pt-4">
                  <Link
                    href="/trades"
                    className="w-full text-center py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors block"
                  >
                    Gerenciar Todas as Minhas Solicitações
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center">
            <p className="text-zinc-400">Nenhum álbum cadastrado ou ativo.</p>
          </div>
        )}
      </main>
    </div>
  );
}
