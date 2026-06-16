"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Copy } from "lucide-react";

export default function DuplicateStickers({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [duplicateStickers, setDuplicateStickers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadDuplicates() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Load album details
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

      // Filter duplicates (qty > 1)
      const duplicates = stickers
        .filter((s) => {
          const qty = myStickersMap.get(s.id) ?? 0;
          return qty > 1;
        })
        .map((s) => ({
          ...s,
          quantity: myStickersMap.get(s.id),
          availableForTrade: (myStickersMap.get(s.id) ?? 1) - 1,
        }));

      setDuplicateStickers(duplicates);
      setLoading(false);
    }

    loadDuplicates();
  }, [albumId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Carregando repetidas...</p>
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
          <h1 className="text-3xl font-bold text-white">Minhas Figurinhas Repetidas</h1>
          <p className="text-zinc-400 text-sm">
            Estas são as figurinhas que você tem mais de uma unidade no álbum **{album?.name}**.
          </p>
        </div>

        {duplicateStickers.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <h3 className="font-bold text-white text-lg">Nenhuma Repetida</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Você não possui figurinhas repetidas neste álbum no momento. As figurinhas com quantidade maior que 1 aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {duplicateStickers.map((sticker) => (
              <div key={sticker.id} className="glass p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30 flex flex-col justify-between gap-4 transition-all hover:scale-[1.02]">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-white bg-black/40 px-2 py-0.5 rounded">
                      {sticker.number}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                      {sticker.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm block truncate">{sticker.name}</h3>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.25 rounded bg-black/20 text-zinc-400">
                      {sticker.type}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.25 rounded bg-black/20 text-zinc-400">
                      {sticker.rarity}
                    </span>
                  </div>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-lg p-2 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Para troca:</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    {sticker.availableForTrade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
