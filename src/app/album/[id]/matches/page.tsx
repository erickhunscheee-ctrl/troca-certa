"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, RefreshCw, Send, Check, Sparkles, Target, Users } from "lucide-react";

export default function SwapMatches({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Market Tabs
  const [activeTab, setActiveTab] = useState<"perfect" | "ineeds" | "all">("perfect");

  const [perfectMatches, setPerfectMatches] = useState<any[]>([]);
  const [iNeedMatches, setINeedMatches] = useState<any[]>([]);
  const [allAvailable, setAllAvailable] = useState<any[]>([]);

  const [myDuplicatesFull, setMyDuplicatesFull] = useState<any[]>([]);
  const [myMissingIds, setMyMissingIds] = useState<string[]>([]);

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
      .eq("album_id", albumId)
      .order("category")
      .order("number");

    if (!allStickers) {
      setLoading(false);
      return;
    }

    const stickersMap = new Map<string, any>();
    allStickers.forEach((s) => stickersMap.set(s.id, s));

    // Get my stickers
    const { data: myStickers } = await supabase
      .from("user_stickers")
      .select("sticker_id, quantity")
      .eq("user_id", session.user.id);

    const myStickersMap = new Map<string, number>();
    myStickers?.forEach((ms) => {
      myStickersMap.set(ms.sticker_id, ms.quantity);
    });

    const currentMissingIds = allStickers.filter((s) => (myStickersMap.get(s.id) ?? 0) === 0).map((s) => s.id);
    const myDuplicateIds = allStickers.filter((s) => (myStickersMap.get(s.id) ?? 0) > 1).map((s) => s.id);

    setMyMissingIds(currentMissingIds);
    setMyDuplicatesFull(myDuplicateIds.map((sid) => stickersMap.get(sid)));

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
      .in("sticker_id", allStickers.map((s) => s.id));

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
        userInventories[uid] = {
          profile: item.profiles,
          duplicates: [],
          missing: [...allStickers.map((s) => s.id)],
        };
      }

      const inventory = userInventories[uid];
      if (item.quantity > 1) {
        inventory.duplicates.push(item.sticker_id);
      }
      if (item.quantity > 0) {
        inventory.missing = inventory.missing.filter((sid) => sid !== item.sticker_id);
      }
    });

    // Compute matches
    const calculatedPerfect: any[] = [];
    const calculatedINeed: any[] = [];
    const calculatedAll: any[] = [];

    Object.keys(userInventories).forEach((uid) => {
      const inventory = userInventories[uid];

      const theirDuplicatesFull = inventory.duplicates.map((sid) => stickersMap.get(sid)).sort((a, b) => a.number.localeCompare(b.number));
      const theyHaveINeedFull = inventory.duplicates.filter((sid) => currentMissingIds.includes(sid)).map((sid) => stickersMap.get(sid)).sort((a, b) => a.number.localeCompare(b.number));
      const iHaveTheyNeedFull = myDuplicateIds.filter((sid) => inventory.missing.includes(sid)).map((sid) => stickersMap.get(sid)).sort((a, b) => a.number.localeCompare(b.number));

      // Build Partner Object
      const partnerData = {
        profile: inventory.profile,
        theirDuplicates: theirDuplicatesFull,
        theyHaveINeed: theyHaveINeedFull,
        iHaveTheyNeed: iHaveTheyNeedFull,
        inventoryMissing: inventory.missing,
      };

      if (theirDuplicatesFull.length > 0) {
        calculatedAll.push(partnerData);
      }

      if (theyHaveINeedFull.length > 0) {
        calculatedINeed.push(partnerData);
      }

      if (theyHaveINeedFull.length > 0 && iHaveTheyNeedFull.length > 0) {
        calculatedPerfect.push(partnerData);
      }
    });

    setPerfectMatches(calculatedPerfect);
    setINeedMatches(calculatedINeed);
    setAllAvailable(calculatedAll);
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
    setOfferedStickers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleRequestSticker = (id: string) => {
    setRequestedStickers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSendTradeRequest = async () => {
    if (offeredStickers.length === 0 || requestedStickers.length === 0 || !currentUser || !selectedPartner) {
      alert("Por favor, selecione pelo menos uma figurinha para enviar e uma para receber.");
      return;
    }

    setSendingRequest(true);
    try {
      const { data: request, error: requestError } = await supabase
        .from("trade_requests")
        .insert({
          album_id: albumId,
          sender_id: currentUser.id,
          receiver_id: selectedPartner.profile.id,
          status: "pending",
        })
        .select()
        .single();

      if (requestError || !request) {
        alert("Erro ao enviar solicitação: " + requestError?.message);
        setSendingRequest(false);
        return;
      }

      const itemsToInsert: any[] = [];
      offeredStickers.forEach((stickerId) => {
        itemsToInsert.push({
          trade_request_id: request.id,
          sticker_id: stickerId,
          sender_id: currentUser.id,
        });
      });
      requestedStickers.forEach((stickerId) => {
        itemsToInsert.push({
          trade_request_id: request.id,
          sticker_id: stickerId,
          sender_id: selectedPartner.profile.id,
        });
      });

      const { error: itemsError } = await supabase
        .from("trade_items")
        .insert(itemsToInsert);

      if (itemsError) {
        alert("Erro ao salvar itens da troca: " + itemsError.message);
      } else {
        setSuccessMsg("Solicitação enviada com sucesso! Redirecionando...");
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

  const getCurrentList = () => {
    if (activeTab === "perfect") return perfectMatches;
    if (activeTab === "ineeds") return iNeedMatches;
    return allAvailable;
  };

  const currentList = getCurrentList();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <Link
            href={`/album/${albumId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Álbum
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Mercado de Trocas</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Explore todas as figurinhas repetidas da comunidade no álbum **{album?.name}**.
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

        {/* Market Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("perfect")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === "perfect"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Matches Perfeitos ({perfectMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("ineeds")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === "ineeds"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Target className="h-4 w-4" />
            O que eu preciso ({iNeedMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === "all"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Todas Disponíveis ({allAvailable.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-sm animate-pulse">Atualizando o mercado...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <h3 className="font-bold text-white text-lg">Nenhum resultado</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Não encontramos nenhum usuário compatível nesta categoria agora. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {currentList.map((match, idx) => (
              <div key={idx} className="glass p-6 rounded-2xl border border-[var(--border-color)] flex flex-col lg:flex-row justify-between items-stretch gap-6">
                {/* Partner Details */}
                <div className="lg:w-1/4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{match.profile.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{match.profile.city} - {match.profile.state}</p>
                    
                    <div className="mt-4 flex flex-col gap-1.5 text-xs">
                      <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded inline-block w-max font-semibold">
                        Ele tem {match.theirDuplicates.length} repetidas
                      </span>
                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block w-max font-semibold">
                        Ele tem {match.theyHaveINeed.length} que você precisa
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openTradeModal(match)}
                    className="mt-6 w-full py-3 px-4 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Solicitar Troca
                  </button>
                </div>

                {/* Stickers matching context based on Active Tab */}
                <div className="flex-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                  {activeTab === "perfect" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Ele tem que eu preciso:</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.theyHaveINeed.map((s: any) => (
                            <span key={s.id} className="text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded">
                              {s.number} - {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Eu tenho que ele precisa:</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.iHaveTheyNeed.map((s: any) => (
                            <span key={s.id} className="text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded">
                              {s.number} - {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "ineeds" && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Ele tem as figurinhas que você procura:</h4>
                      <div className="flex flex-wrap gap-2">
                        {match.theyHaveINeed.map((s: any) => (
                          <span key={s.id} className="text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded">
                            {s.number} - {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "all" && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">Todas as repetidas de {match.profile.name}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {match.theirDuplicates.map((s: any) => {
                          const iNeedThis = myMissingIds.includes(s.id);
                          return (
                            <span key={s.id} className={`text-[11px] font-bold border px-2 py-1 rounded ${
                              iNeedThis ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                            }`}>
                              {s.number} - {s.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade Request Creator Modal - NOVO FORMATO LIVRE */}
        {isModalOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="glass w-full max-w-4xl rounded-2xl border border-[var(--border-color)] p-6 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Criar Proposta de Troca</h3>
                  <p className="text-xs text-zinc-400">
                    Você pode oferecer qualquer uma de suas repetidas e pedir qualquer repetida de **{selectedPartner.profile.name}**.
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
                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col md:flex-row gap-6 py-2">
                    {/* Coluna Esquerda: O QUE VOU ENVIAR (Minhas Repetidas) */}
                    <div className="flex-1 border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex flex-col">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                        <span className="bg-amber-500 text-black px-2 py-0.5 rounded-md text-xs">Vou Enviar</span>
                        Minhas Repetidas
                      </h4>
                      {myDuplicatesFull.length === 0 ? (
                         <p className="text-xs text-zinc-500 italic">Você não tem figurinhas repetidas para oferecer.</p>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 overflow-y-auto pr-1 pb-4">
                          {myDuplicatesFull.map((s: any) => {
                            const active = offeredStickers.includes(s.id);
                            const partnerNeeds = selectedPartner.inventoryMissing.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => toggleOfferSticker(s.id)}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                                  active
                                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                                    : "bg-black/40 border-white/5 text-zinc-400 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{s.number} - {s.name}</span>
                                  {active && <Check className="h-4 w-4 text-amber-400 shrink-0" />}
                                </div>
                                {partnerNeeds && !active && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded w-max">
                                    Ele precisa
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Coluna Direita: O QUE VOU RECEBER (Repetidas Dele) */}
                    <div className="flex-1 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 flex flex-col">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                        <span className="bg-emerald-500 text-black px-2 py-0.5 rounded-md text-xs">Vou Receber</span>
                        Repetidas de {selectedPartner.profile.name}
                      </h4>
                      {selectedPartner.theirDuplicates.length === 0 ? (
                         <p className="text-xs text-zinc-500 italic">Ele não tem figurinhas repetidas.</p>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 overflow-y-auto pr-1 pb-4">
                          {selectedPartner.theirDuplicates.map((s: any) => {
                            const active = requestedStickers.includes(s.id);
                            const iNeed = myMissingIds.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => toggleRequestSticker(s.id)}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                                  active
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                                    : "bg-black/40 border-white/5 text-zinc-400 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{s.number} - {s.name}</span>
                                  {active && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                                </div>
                                {iNeed && !active && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded w-max">
                                    Você precisa
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center">
                    <div className="text-xs text-zinc-400">
                      Enviando: <strong className="text-amber-400">{offeredStickers.length}</strong> | 
                      Recebendo: <strong className="text-emerald-400">{requestedStickers.length}</strong>
                    </div>
                    <div className="flex gap-3">
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
