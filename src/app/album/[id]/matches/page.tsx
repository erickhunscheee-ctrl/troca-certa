"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, RefreshCw, Send, Check } from "lucide-react";

export default function SwapMatches({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [offeredStickers, setOfferedStickers] = useState<string[]>([]);
  const [requestedStickers, setRequestedStickers] = useState<string[]>([]);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  const loadMatches = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setCurrentUser(session.user);

    // Get album details
    const { data: albumData } = await supabase
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .single();
    setAlbum(albumData);

    // Get all stickers in this album
    const { data: allStickers } = await supabase
      .from("stickers")
      .select("*")
      .eq("album_id", albumId);

    if (!allStickers) {
      setLoading(false);
      return;
    }

    const stickersMap = new Map<string, any>();
    allStickers.forEach(s => stickersMap.set(s.id, s));

    // Get my stickers
    const { data: myStickers } = await supabase
      .from("user_stickers")
      .select("sticker_id, quantity")
      .eq("user_id", session.user.id);

    const myStickersMap = new Map<string, number>();
    myStickers?.forEach((ms) => {
      myStickersMap.set(ms.sticker_id, ms.quantity);
    });

    const myMissingIds = allStickers.filter(s => (myStickersMap.get(s.id) ?? 0) === 0).map(s => s.id);
    const myDuplicateIds = allStickers.filter(s => (myStickersMap.get(s.id) ?? 0) > 1).map(s => s.id);

    // Get all other users' stickers
    const { data: otherUserStickers } = await supabase
      .from("user_stickers")
      .select(`
        sticker_id,
        quantity,
        user_id,
        profiles(id, name, city, state)
      `)
      .neq("user_id", session.user.id)
      .in("sticker_id", allStickers.map(s => s.id));

    if (!otherUserStickers) {
      setLoading(false);
      return;
    }

    // Group other users' stickers by user_id
    const userInventories: { [userId: string]: { profile: any; duplicates: string[]; missing: string[] } } = {};

    otherUserStickers.forEach((item: any) => {
      if (!item.profiles) return;
      const uid = item.user_id;
      if (!userInventories[uid]) {
        // Initialize missing stickers for this other user
        // We will assume they don't have anything unless listed
        userInventories[uid] = {
          profile: item.profiles,
          duplicates: [],
          missing: [...allStickers.map(s => s.id)]
        };
      }
      
      const inventory = userInventories[uid];
      if (item.quantity > 1) {
        inventory.duplicates.push(item.sticker_id);
      }
      if (item.quantity > 0) {
        inventory.missing = inventory.missing.filter(sid => sid !== item.sticker_id);
      }
    });

    // Compute matches
    const calculatedMatches: any[] = [];

    Object.keys(userInventories).forEach((uid) => {
      const inventory = userInventories[uid];
      
      // Stickers they have duplicates of that I need
      const theyHaveINeed = inventory.duplicates.filter(sid => myMissingIds.includes(sid));
      
      // Stickers I have duplicates of that they need
      const iHaveTheyNeed = myDuplicateIds.filter(sid => inventory.missing.includes(sid));

      // Match occurs if both sides have at least 1 sticker of interest
      if (theyHaveINeed.length > 0 && iHaveTheyNeed.length > 0) {
        calculatedMatches.push({
          profile: inventory.profile,
          theyHaveINeed: theyHaveINeed.map(sid => stickersMap.get(sid)),
          iHaveTheyNeed: iHaveTheyNeed.map(sid => stickersMap.get(sid))
        });
      }
    });

    setMatches(calculatedMatches);
    setLoading(false);
  };

  useEffect(() => {
    loadMatches();
  }, [albumId]);

  const openTradeModal = (partner: any) => {
    setSelectedPartner(partner);
    setOfferedStickers([]);
    setRequestedStickers([]);
    setIsModalOpen(true);
  };

  const toggleOfferSticker = (id: string) => {
    setOfferedStickers(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleRequestSticker = (id: string) => {
    setRequestedStickers(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSendTradeRequest = async () => {
    if (offeredStickers.length === 0 || requestedStickers.length === 0 || !currentUser || !selectedPartner) {
      alert("Por favor, selecione pelo menos uma figurinha de cada lado.");
      return;
    }

    setSendingRequest(true);
    try {
      // 1. Create trade request
      const { data: request, error: requestError } = await supabase
        .from("trade_requests")
        .insert({
          album_id: albumId,
          sender_id: currentUser.id,
          receiver_id: selectedPartner.profile.id,
          status: "pending"
        })
        .select()
        .single();

      if (requestError || !request) {
        console.error("Error creating request", requestError);
        alert("Erro ao enviar solicitação: " + requestError?.message);
        setSendingRequest(false);
        return;
      }

      // 2. Create trade items
      const itemsToInsert: any[] = [];
      offeredStickers.forEach((stickerId) => {
        itemsToInsert.push({
          trade_request_id: request.id,
          sticker_id: stickerId,
          sender_id: currentUser.id
        });
      });
      requestedStickers.forEach((stickerId) => {
        itemsToInsert.push({
          trade_request_id: request.id,
          sticker_id: stickerId,
          sender_id: selectedPartner.profile.id
        });
      });

      const { error: itemsError } = await supabase
        .from("trade_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating trade items", itemsError);
        alert("Erro ao salvar itens da troca: " + itemsError.message);
      } else {
        setSuccessMsg("Solicitação enviada com sucesso! Redirecionando para trocas...");
        setTimeout(() => {
          setIsModalOpen(false);
          router.push("/trades");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingRequest(false);
    }
  };

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Oportunidades de Troca</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Encontre pessoas que precisam do que você tem repetido e que têm o que você precisa no álbum **{album?.name}**.
              </p>
            </div>
            <button
              onClick={loadMatches}
              className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-sm animate-pulse">Calculando matches inteligentes...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <h3 className="font-bold text-white text-lg">Sem Oportunidades</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Nenhum outro usuário compatível foi encontrado. Adicione mais figurinhas repetidas ou faltantes para aumentar as chances.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {matches.map((match, idx) => (
              <div key={idx} className="glass p-6 rounded-2xl border border-[var(--border-color)] flex flex-col lg:flex-row justify-between items-stretch gap-6">
                
                {/* Partner Details */}
                <div className="lg:w-1/4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{match.profile.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{match.profile.city} - {match.profile.state}</p>
                  </div>
                  
                  <button
                    onClick={() => openTradeModal(match)}
                    className="mt-6 w-full py-3 px-4 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Solicitar Troca
                  </button>
                </div>

                {/* Stickers matching */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                  {/* What they have that I need */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                      Ele tem ({match.theyHaveINeed.length}) que eu preciso:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.theyHaveINeed.map((s: any) => (
                        <span key={s.id} className="text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded">
                          {s.number} - {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* What I have that they need */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                      Eu tenho ({match.iHaveTheyNeed.length}) que ele precisa:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.iHaveTheyNeed.map((s: any) => (
                        <span key={s.id} className="text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded">
                          {s.number} - {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Trade Request Creator Modal */}
        {isModalOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="glass w-full max-w-2xl rounded-2xl border border-[var(--border-color)] p-6 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Solicitar Troca</h3>
                  <p className="text-xs text-zinc-400">
                    Proposta de troca com **{selectedPartner.profile.name}**
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white font-bold cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {successMsg ? (
                <div className="my-auto py-12 flex flex-col items-center justify-center text-center">
                  <span className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4 animate-bounce">
                    <Check className="h-6 w-6" />
                  </span>
                  <p className="text-emerald-400 font-semibold">{successMsg}</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 py-2">
                    {/* Offer column */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                        Minhas figurinhas que vou enviar (Selecione pelo menos uma):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedPartner.iHaveTheyNeed.map((s: any) => {
                          const active = offeredStickers.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleOfferSticker(s.id)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                active
                                  ? "bg-amber-500/10 border-amber-500 text-amber-300 font-bold"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/10"
                              }`}
                            >
                              <span>{s.number} - {s.name}</span>
                              {active && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Request column */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5">
                        Figurinhas dele que vou receber (Selecione pelo menos uma):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedPartner.theyHaveINeed.map((s: any) => {
                          const active = requestedStickers.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleRequestSticker(s.id)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                active
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/10"
                              }`}
                            >
                              <span>{s.number} - {s.name}</span>
                              {active && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendTradeRequest}
                      disabled={sendingRequest || offeredStickers.length === 0 || requestedStickers.length === 0}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] transition-all shadow-md shadow-[var(--primary)]/10 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sendingRequest ? "Enviando..." : "Enviar Solicitação"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
