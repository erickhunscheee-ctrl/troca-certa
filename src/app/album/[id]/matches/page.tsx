"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { showErrorToast } from "@/lib/toast";
import { ArrowLeft, RefreshCw, Send, Check, Sparkles, Target, Users } from "lucide-react";

export default function SwapMatches({ params }: { params: Promise<{ id: string }> }) {
  const { id: albumId } = use(params);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"perfect" | "ineeds" | "all">("perfect");
  const [perfectMatches, setPerfectMatches] = useState<any[]>([]);
  const [iNeedMatches, setINeedMatches] = useState<any[]>([]);
  const [allAvailable, setAllAvailable] = useState<any[]>([]);
  const [myDuplicatesFull, setMyDuplicatesFull] = useState<any[]>([]);
  const [myMissingIds, setMyMissingIds] = useState<string[]>([]);
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

    const { data: albumData } = await supabase.from("albums").select("*").eq("id", albumId).single();
    setAlbum(albumData);

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

    const { data: myStickers } = await supabase.from("user_stickers").select("sticker_id, quantity").eq("user_id", session.user.id);
    const myStickersMap = new Map<string, number>();
    myStickers?.forEach((ms) => myStickersMap.set(ms.sticker_id, ms.quantity));

    const currentMissingIds = allStickers.filter((s) => (myStickersMap.get(s.id) ?? 0) === 0).map((s) => s.id);
    const myDuplicateIds = allStickers.filter((s) => (myStickersMap.get(s.id) ?? 0) > 1).map((s) => s.id);

    setMyMissingIds(currentMissingIds);
    setMyDuplicatesFull(myDuplicateIds.map((sid) => stickersMap.get(sid)));

    const { data: otherUserStickers } = await supabase
      .from("user_stickers")
      .select(`
        sticker_id,
        quantity,
        user_id,
        price,
        profiles(id, name, city, state),
        stickers!inner(album_id)
      `)
      .neq("user_id", session.user.id)
      .eq("stickers.album_id", albumId);

    if (!otherUserStickers) {
      setLoading(false);
      return;
    }

    const userInventories: { [userId: string]: { profile: any; duplicates: { id: string; price: number | null }[]; missing: string[] } } = {};

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
        inventory.duplicates.push({ id: item.sticker_id, price: item.price });
      }
      if (item.quantity > 0) {
        inventory.missing = inventory.missing.filter((sid) => sid !== item.sticker_id);
      }
    });

    const calculatedPerfect: any[] = [];
    const calculatedINeed: any[] = [];
    const calculatedAll: any[] = [];

    Object.keys(userInventories).forEach((uid) => {
      const inventory = userInventories[uid];
      const theirDuplicatesFull = inventory.duplicates
        .map((dup) => ({ ...stickersMap.get(dup.id), price: dup.price }))
        .sort((a, b) => a.number.localeCompare(b.number));
      const theyHaveINeedFull = theirDuplicatesFull.filter((dup) => currentMissingIds.includes(dup.id));
      const iHaveTheyNeedFull = myDuplicateIds
        .filter((sid) => inventory.missing.includes(sid))
        .map((sid) => stickersMap.get(sid))
        .sort((a, b) => a.number.localeCompare(b.number));

      const partnerData = {
        profile: inventory.profile,
        theirDuplicates: theirDuplicatesFull,
        theyHaveINeed: theyHaveINeedFull,
        iHaveTheyNeed: iHaveTheyNeedFull,
        inventoryMissing: inventory.missing,
      };

      if (theirDuplicatesFull.length > 0) calculatedAll.push(partnerData);
      if (theyHaveINeedFull.length > 0) calculatedINeed.push(partnerData);
      if (theyHaveINeedFull.length > 0 && iHaveTheyNeedFull.length > 0) calculatedPerfect.push(partnerData);
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
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const toggleOfferSticker = (id: string) => {
    setOfferedStickers((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const toggleRequestSticker = (id: string) => {
    setRequestedStickers((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const handleSendTradeRequest = async () => {
    if (offeredStickers.length === 0 || requestedStickers.length === 0 || !currentUser || !selectedPartner) {
      showErrorToast("Por favor, selecione pelo menos uma figurinha para enviar e uma para receber.");
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
        showErrorToast("Erro ao enviar solicitacao: " + (requestError?.message || "tente novamente."));
        setSendingRequest(false);
        return;
      }

      const itemsToInsert: any[] = [];
      offeredStickers.forEach((stickerId) => {
        itemsToInsert.push({ trade_request_id: request.id, sticker_id: stickerId, sender_id: currentUser.id });
      });
      requestedStickers.forEach((stickerId) => {
        itemsToInsert.push({ trade_request_id: request.id, sticker_id: stickerId, sender_id: selectedPartner.profile.id });
      });

      const { error: itemsError } = await supabase.from("trade_items").insert(itemsToInsert);

      if (itemsError) {
        showErrorToast("Erro ao salvar itens da troca: " + itemsError.message);
      } else {
        setSuccessMsg("Solicitação enviada com sucesso! Redirecionando...");
        setTimeout(() => {
          setIsModalOpen(false);
          router.push("/trades");
        }, 1800);
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Ocorreu um erro ao criar a proposta de troca.");
    } finally {
      setSendingRequest(false);
    }
  };

  const currentList = activeTab === "perfect" ? perfectMatches : activeTab === "ineeds" ? iNeedMatches : allAvailable;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex w-full flex-col gap-6">
          <section className="glass relative overflow-hidden rounded-[28px] border border-[var(--border-color)] p-5 shadow-[0_20px_60px_rgba(10,27,61,0.08)] sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,77,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_30%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Link href={`/album/${albumId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-slate)] transition-colors hover:text-[var(--brand-navy)]">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao álbum
                </Link>
                <div>
                  <h1 className="font-display max-w-2xl text-3xl font-black tracking-tight text-[var(--brand-navy)] sm:text-4xl">Mercado de Trocas</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--brand-slate)] sm:text-base">
                    Explore figurinhas repetidas da comunidade no álbum <strong>{album?.name}</strong> e encontre trocas mais rápidas.
                  </p>
                </div>
              </div>
              <button
                onClick={loadMatches}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-color)] bg-white/85 p-3 text-[var(--brand-slate)] transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </section>

          <div className="grid gap-3 rounded-[24px] border border-[var(--border-color)] bg-white/85 p-2 shadow-[0_16px_40px_rgba(10,27,61,0.06)] sm:grid-cols-3">
            <button
              onClick={() => setActiveTab("perfect")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold transition-all ${
                activeTab === "perfect"
                  ? "bg-[var(--brand-navy)] text-white shadow-lg shadow-[rgba(10,27,61,0.18)]"
                  : "text-[var(--brand-slate)] hover:bg-[var(--background)] hover:text-[var(--brand-navy)]"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Matches Perfeitos ({perfectMatches.length})
            </button>
            <button
              onClick={() => setActiveTab("ineeds")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold transition-all ${
                activeTab === "ineeds"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-[var(--brand-slate)] hover:bg-[var(--background)] hover:text-[var(--brand-navy)]"
              }`}
            >
              <Target className="h-4 w-4" />
              O que eu preciso ({iNeedMatches.length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold transition-all ${
                activeTab === "all"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "text-[var(--brand-slate)] hover:bg-[var(--background)] hover:text-[var(--brand-navy)]"
              }`}
            >
              <Users className="h-4 w-4" />
              Todas Disponíveis ({allAvailable.length})
            </button>
          </div>

          {loading ? (
            <div className="glass rounded-[24px] border border-[var(--border-color)] py-16 text-center">
              <p className="animate-pulse text-sm text-[var(--brand-slate)]">Atualizando o mercado...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="glass mx-auto max-w-md rounded-[24px] border border-[var(--border-color)] p-10 text-center">
              <h3 className="text-lg font-bold text-[var(--brand-navy)]">Nenhum resultado</h3>
              <p className="mt-2 text-sm text-[var(--brand-slate)]">Não encontramos nenhum usuário compatível nesta categoria agora. Tente novamente mais tarde.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {currentList.map((match, idx) => (
                <article key={idx} className="glass overflow-hidden rounded-[28px] border border-[var(--border-color)] shadow-[0_14px_40px_rgba(10,27,61,0.06)]">
                  <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                    <div className="flex flex-col justify-between gap-5 border-b border-[var(--border-color)] bg-gradient-to-br from-white to-[rgba(17,77,255,0.04)] p-6 lg:border-b-0 lg:border-r">
                      <div>
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-navy)] text-sm font-black text-white shadow-lg shadow-[rgba(10,27,61,0.14)]">
                            {match.profile.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-[var(--brand-navy)]">{match.profile.name}</h3>
                            <p className="text-sm text-[var(--brand-slate)]">
                              {match.profile.city} - {match.profile.state}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-500/20">
                            {match.theirDuplicates.length} repetidas
                          </span>
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
                            {match.theyHaveINeed.length} que você precisa
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openTradeModal(match)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(17,77,255,0.18)] transition-all hover:-translate-y-0.5 hover:from-[var(--primary-hover)] hover:to-[var(--primary)]"
                      >
                        <Send className="h-4 w-4" />
                        Solicitar troca
                      </button>
                    </div>

                    <div className="p-6">
                      {activeTab === "perfect" && (
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Ele tem que eu preciso</h4>
                            <div className="flex flex-wrap gap-2">
                              {match.theyHaveINeed.map((s: any) => (
                                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                                  <span>
                                    {s.number} - {s.name}
                                  </span>
                                  {s.price !== null && s.price !== undefined && (
                                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                                      R$ {parseFloat(s.price).toFixed(2)}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-700">Eu tenho que ele precisa</h4>
                            <div className="flex flex-wrap gap-2">
                              {match.iHaveTheyNeed.map((s: any) => (
                                <span key={s.id} className="inline-flex items-center rounded-full border border-amber-500/20 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 shadow-sm">
                                  {s.number} - {s.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "ineeds" && (
                        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Ele tem as figurinhas que você procura</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.theyHaveINeed.map((s: any) => (
                              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                                <span>
                                  {s.number} - {s.name}
                                </span>
                                {s.price !== null && s.price !== undefined && (
                                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                                    R$ {parseFloat(s.price).toFixed(2)}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === "all" && (
                        <div className="rounded-2xl border border-[var(--border-color)] bg-white/70 p-4">
                          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-slate)]">
                            Todas as repetidas de {match.profile.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.theirDuplicates.map((s: any) => {
                              const iNeedThis = myMissingIds.includes(s.id);
                              return (
                                <span
                                  key={s.id}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm ${
                                    iNeedThis
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                                      : "border-[var(--border-color)] bg-white text-[var(--brand-slate)]"
                                  }`}
                                >
                                  <span>
                                    {s.number} - {s.name}
                                  </span>
                                  {s.price !== null && s.price !== undefined && (
                                    <span className="rounded-full bg-[var(--brand-navy)] px-1.5 py-0.5 text-[9px] font-black text-white">
                                      R$ {parseFloat(s.price).toFixed(2)}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {isModalOpen && selectedPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
              <div className="glass flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[var(--border-color)] p-6 shadow-[0_30px_80px_rgba(10,27,61,0.22)]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--brand-navy)]">Criar Proposta de Troca</h3>
                    <p className="text-xs text-[var(--brand-slate)]">
                      Você pode oferecer qualquer uma de suas repetidas e pedir qualquer repetida de {selectedPartner.profile.name}.
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-sm font-bold text-[var(--brand-slate)] hover:text-[var(--brand-navy)]">
                    Fechar
                  </button>
                </div>

                {successMsg ? (
                  <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                      <Check className="h-6 w-6" />
                    </span>
                    <p className="font-semibold text-emerald-700">{successMsg}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto py-2 pr-2">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="flex flex-col rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-700">
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">Vou enviar</span>
                            Minhas repetidas
                          </h4>
                          {myDuplicatesFull.length === 0 ? (
                            <p className="text-xs italic text-[var(--brand-slate)]">Você não tem figurinhas repetidas para oferecer.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
                              {myDuplicatesFull.map((s: any) => {
                                const active = offeredStickers.includes(s.id);
                                const partnerNeeds = selectedPartner.inventoryMissing.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => toggleOfferSticker(s.id)}
                                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-left text-xs transition-all ${
                                      active
                                        ? "border-amber-500 bg-amber-500/15 text-amber-800"
                                        : "border-[var(--border-color)] bg-white/70 text-[var(--brand-slate)] hover:border-amber-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="font-semibold">
                                        {s.number} - {s.name}
                                      </span>
                                      {active && <Check className="h-4 w-4 shrink-0 text-amber-600" />}
                                    </div>
                                    {partnerNeeds && !active && (
                                      <span className="w-max rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                        Ele precisa
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white">Vou receber</span>
                            Repetidas de {selectedPartner.profile.name}
                          </h4>
                          {selectedPartner.theirDuplicates.length === 0 ? (
                            <p className="text-xs italic text-[var(--brand-slate)]">Ele não tem figurinhas repetidas.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
                              {selectedPartner.theirDuplicates.map((s: any) => {
                                const active = requestedStickers.includes(s.id);
                                const iNeed = myMissingIds.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => toggleRequestSticker(s.id)}
                                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-left text-xs transition-all ${
                                      active
                                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-800"
                                        : "border-[var(--border-color)] bg-white/70 text-[var(--brand-slate)] hover:border-emerald-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="font-semibold">
                                        {s.number} - {s.name}
                                      </span>
                                      {active && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                      {iNeed && !active && <span className="w-max rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Você precisa</span>}
                                      {s.price !== null && s.price !== undefined && (
                                        <span className="w-max rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                          R$ {parseFloat(s.price).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-4">
                      <div className="text-xs text-[var(--brand-slate)]">
                        Enviando: <strong className="text-amber-700">{offeredStickers.length}</strong> | Recebendo: <strong className="text-emerald-700">{requestedStickers.length}</strong>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-xs font-bold text-[var(--brand-slate)] transition-colors hover:text-[var(--brand-navy)]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSendTradeRequest}
                          disabled={sendingRequest || offeredStickers.length === 0 || requestedStickers.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[rgba(17,77,255,0.14)] transition-all disabled:cursor-not-allowed disabled:opacity-40"
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
        </div>
      </main>
    </div>
  );
}
