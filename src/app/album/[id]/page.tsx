"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Plus, Minus, Check, Copy, HelpCircle, Search, Filter } from "lucide-react";

export default function AlbumDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<{ [stickerId: string]: number }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadAlbumAndStickers() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      // Load album details
      const { data: albumData, error: albumError } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .single();

      if (albumError || !albumData) {
        console.error("Error loading album", albumError);
        router.push("/dashboard");
        return;
      }
      setAlbum(albumData);

      // Load all stickers in the album
      const { data: stickersData, error: stickersError } = await supabase
        .from("stickers")
        .select("*")
        .eq("album_id", albumId)
        .order("category")
        .order("number");

      if (stickersError || !stickersData) {
        console.error("Error loading stickers", stickersError);
        return;
      }
      setStickers(stickersData);

      // Load user inventory for these stickers
      const { data: userStickersData } = await supabase
        .from("user_stickers")
        .select("*")
        .eq("user_id", session.user.id)
        .in("sticker_id", stickersData.map(s => s.id));

      const qtyMap: { [stickerId: string]: number } = {};
      stickersData.forEach((s) => {
        qtyMap[s.id] = 0;
      });
      userStickersData?.forEach((us) => {
        qtyMap[us.sticker_id] = us.quantity;
      });

      setQuantities(qtyMap);
      setLoading(false);
    }

    loadAlbumAndStickers();
  }, [albumId, router]);

  const updateQuantity = async (stickerId: string, newQty: number) => {
    if (newQty < 0 || !userId) return;

    setUpdatingId(stickerId);
    
    // Update local state first for instant response
    setQuantities(prev => ({
      ...prev,
      [stickerId]: newQty
    }));

    try {
      const { error } = await supabase
        .from("user_stickers")
        .upsert(
          {
            user_id: userId,
            sticker_id: stickerId,
            quantity: newQty,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id,sticker_id" }
        );

      if (error) {
        console.error("Error updating sticker quantity", error);
        // Revert local state on error
        const { data: original } = await supabase
          .from("user_stickers")
          .select("quantity")
          .eq("user_id", userId)
          .eq("sticker_id", stickerId)
          .single();
        
        setQuantities(prev => ({
          ...prev,
          [stickerId]: original?.quantity || 0
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Carregando figurinhas...</p>
        </main>
      </div>
    );
  }

  // Obter lista única de categorias para o filtro
  const allCategories = Array.from(new Set(stickers.map((s) => s.category)));

  // Filtragem das figurinhas com base na busca e na categoria ativa
  const filteredStickers = stickers.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory ? s.category === activeCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  // Agrupando as figurinhas filtradas
  const categories: { [name: string]: any[] } = {};
  filteredStickers.forEach((s) => {
    if (!categories[s.category]) {
      categories[s.category] = [];
    }
    categories[s.category].push(s);
  });

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Link & Title */}
        <div className="flex flex-col gap-2 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{album?.name}</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Altere a quantidade de cada figurinha clicando nos botões de + e -
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/album/${albumId}/missing`}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              >
                Faltantes
              </Link>
              <Link
                href={`/album/${albumId}/duplicates`}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              >
                Repetidas
              </Link>
              <Link
                href={`/album/${albumId}/matches`}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] transition-all shadow-md shadow-[var(--primary)]/10"
              >
                Oportunidades de Troca
              </Link>
            </div>
          </div>
        </div>

        {/* Buscador e Filtro de Categorias (Sticky para facilitar o acesso) */}
        <div className="sticky top-[64px] z-40 bg-[var(--background)]/90 backdrop-blur-md pt-2 pb-4 mb-6 border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Input de Busca */}
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome (ex: Messi) ou número (ex: ARG 1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            {/* Scroll Horizontal de Categorias */}
            <div className="flex items-center gap-2 w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Filter className="h-4 w-4 text-zinc-500 shrink-0 ml-2" />
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === null
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                Todas
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[var(--primary)] text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-8 text-xs bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider">Legenda:</span>
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="h-3 w-3 rounded bg-zinc-800 border border-zinc-700" />
            Faltando (0)
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
            Tenho (1)
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500/30" />
            Repetida (1+)
          </div>
          
          <div className="ml-auto text-zinc-500 font-semibold">
            {filteredStickers.length} figurinha(s) encontrada(s)
          </div>
        </div>

        {/* Stickers Grid by Category */}
        <div className="flex flex-col gap-10">
          {Object.keys(categories).length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-white/5">
              <p className="text-zinc-400">Nenhuma figurinha encontrada com esses filtros.</p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                className="mt-4 text-[var(--primary)] text-sm font-semibold hover:underline cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            Object.keys(categories).map((catName) => (
              <div key={catName} className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-white border-l-4 border-[var(--primary)] pl-3">
                  {catName}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {categories[catName].map((sticker) => {
                    const qty = quantities[sticker.id] || 0;
                    
                    // Styling based on quantity
                    let cardStyle = "bg-zinc-900/50 border-zinc-800 text-zinc-400";
                    let statusBadge = (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Falta
                      </span>
                    );

                    if (qty === 1) {
                      cardStyle = "bg-emerald-950/20 border-emerald-800/40 text-emerald-300";
                      statusBadge = (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <Check className="h-3.5 w-3.5" />
                          Tenho
                        </span>
                      );
                    } else if (qty > 1) {
                      cardStyle = "bg-amber-950/20 border-amber-800/40 text-amber-300";
                      statusBadge = (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                          <Copy className="h-3.5 w-3.5" />
                          Repetida (+{qty - 1})
                        </span>
                      );
                    }

                    return (
                      <div
                        key={sticker.id}
                        className={`glass p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:scale-[1.02] ${cardStyle}`}
                      >
                        {/* Sticker top meta */}
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-sm tracking-wide text-white bg-black/30 px-2 py-0.5 rounded">
                            {sticker.number}
                          </span>
                          {statusBadge}
                        </div>

                        {/* Name / Info */}
                        <div>
                          <span className="text-white font-bold text-sm block truncate" title={sticker.name}>
                            {sticker.name}
                          </span>
                          <div className="flex gap-1.5 mt-1">
                            <span className="text-[9px] px-1.5 py-0.25 rounded bg-black/20 text-zinc-400">
                              {sticker.type}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.25 rounded bg-black/20 text-zinc-400 truncate max-w-[60px]" title={sticker.rarity}>
                              {sticker.rarity}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between bg-black/40 rounded-lg p-1 border border-white/5">
                          <button
                            onClick={() => updateQuantity(sticker.id, qty - 1)}
                            disabled={qty === 0 || updatingId === sticker.id}
                            className="h-8 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <span className="text-white font-bold text-sm w-8 text-center">
                            {qty}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(sticker.id, qty + 1)}
                            disabled={updatingId === sticker.id}
                            className="h-8 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
