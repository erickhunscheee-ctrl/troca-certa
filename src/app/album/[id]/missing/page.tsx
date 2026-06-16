"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, User as UserIcon, Coins } from "lucide-react";

export default function MissingStickers({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [missingStickers, setMissingStickers] = useState<any[]>([]);
  const [ownersMap, setOwnersMap] = useState<{ [stickerId: string]: any[] }>({});
  const router = useRouter();

  useEffect(() => {
    async function loadMissing() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Load album
      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .single();
      setAlbum(albumData);

      // Load all stickers
      const { data: stickers } = await supabase
        .from("stickers")
        .select("*")
        .eq("album_id", albumId);

      if (!stickers) {
        setLoading(false);
        return;
      }

      // Load my stickers
      const { data: myStickers } = await supabase
        .from("user_stickers")
        .select("sticker_id, quantity")
        .eq("user_id", session.user.id);

      const myStickersMap = new Map<string, number>();
      myStickers?.forEach((ms) => {
        myStickersMap.set(ms.sticker_id, ms.quantity);
      });

      // Filter missing (qty === 0 or not found)
      const missing = stickers.filter((s) => {
        const qty = myStickersMap.get(s.id) ?? 0;
        return qty === 0;
      });

      setMissingStickers(missing);

      if (missing.length > 0) {
        // Load other users' duplicates for these missing stickers
        const missingIds = missing.map((s) => s.id);
        const { data: duplicates } = await supabase
          .from("user_stickers")
          .select(`
            sticker_id,
            quantity,
            user_id,
            profiles(name, city, state)
          `)
          .neq("user_id", session.user.id)
          .in("sticker_id", missingIds)
          .gt("quantity", 1);

        const oMap: { [stickerId: string]: any[] } = {};
        missingIds.forEach((id) => {
          oMap[id] = [];
        });

        duplicates?.forEach((dup: any) => {
          if (dup.profiles) {
            oMap[dup.sticker_id].push({
              userId: dup.user_id,
              name: dup.profiles.name,
              location: `${dup.profiles.city} - ${dup.profiles.state}`,
              qty: dup.quantity - 1, // units available for trade
            });
          }
        });

        setOwnersMap(oMap);
      }

      setLoading(false);
    }

    loadMissing();
  }, [albumId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Buscando figurinhas faltantes...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <Link
            href={`/album/${albumId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Álbum
          </Link>
          <h1 className="text-3xl font-bold text-white">Figurinhas Faltantes</h1>
          <p className="text-zinc-400 text-sm">
            Estas são as figurinhas que você ainda não possui no álbum **{album?.name}**.
          </p>
        </div>

        {missingStickers.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <h3 className="font-bold text-white text-lg">Parabéns! 🎉</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Você já possui todas as figurinhas deste álbum!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missingStickers.map((sticker) => {
              const owners = ownersMap[sticker.id] || [];
              return (
                <div key={sticker.id} className="glass p-5 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-extrabold text-sm text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--primary)]/20">
                        {sticker.number}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        {sticker.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-lg">{sticker.name}</h3>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] px-1.5 py-0.25 rounded bg-white/5 text-zinc-400">
                        {sticker.type}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.25 rounded bg-white/5 text-zinc-400">
                        {sticker.rarity}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-bold text-zinc-300 mb-2">Quem tem para troca:</h4>
                    {owners.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic">
                        Nenhum usuário com essa figurinha repetida no momento.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                        {owners.map((owner, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="h-3 w-3 text-zinc-400" />
                              <div>
                                <span className="font-semibold text-zinc-300 block">{owner.name}</span>
                                <span className="text-[9px] text-zinc-500">{owner.location}</span>
                              </div>
                            </div>
                            <span className="text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.25 rounded">
                              {owner.qty} rep.
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
