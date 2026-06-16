"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ClipboardList, Check, X, Ban, MessageSquare, CheckSquare } from "lucide-react";

export default function Trades() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const router = useRouter();

  const loadTrades = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setCurrentUser(session.user);

    // Fetch trade requests involving me
    const { data: requests, error } = await supabase
      .from("trade_requests")
      .select(`
        id,
        status,
        created_at,
        album_id,
        albums(name),
        sender_id,
        receiver_id,
        sender:profiles!trade_requests_sender_id_fkey(id, name, city, state, whatsapp),
        receiver:profiles!trade_requests_receiver_id_fkey(id, name, city, state, whatsapp),
        trade_items(
          id,
          sticker_id,
          sender_id,
          stickers(number, name, category)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading trades", error);
    } else if (requests) {
      // Filter requests involving current user
      const filtered = requests.filter(
        (r) => r.sender_id === session.user.id || r.receiver_id === session.user.id
      );
      setTrades(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleUpdateStatus = async (tradeId: string, newStatus: string) => {
    setProcessingId(tradeId);
    try {
      const { error } = await supabase
        .from("trade_requests")
        .update({ status: newStatus })
        .eq("id", tradeId);

      if (error) {
        alert("Erro ao atualizar status: " + error.message);
      } else {
        // If status is accepted, automatically create a chat if it doesn't exist
        if (newStatus === "accepted") {
          const { error: chatError } = await supabase
            .from("chats")
            .upsert({ trade_request_id: tradeId }, { onConflict: "trade_request_id" });

          if (chatError) {
            console.error("Error creating chat", chatError);
          }
        }
        await loadTrades();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteTrade = async (trade: any) => {
    if (!confirm("Tem certeza que deseja concluir esta troca? Isso alterará o estoque de figurinhas de ambos os usuários.")) {
      return;
    }
    
    setProcessingId(trade.id);
    try {
      const items = trade.trade_items || [];
      
      // Perform sequential inventory updates for simplicity in MVP client code
      for (const item of items) {
        const itemSenderId = item.sender_id;
        const itemReceiverId = itemSenderId === trade.sender_id ? trade.receiver_id : trade.sender_id;
        
        // 1. Deduct from sender's inventory
        // First get current quantity
        const { data: senderUs } = await supabase
          .from("user_stickers")
          .select("quantity")
          .eq("user_id", itemSenderId)
          .eq("sticker_id", item.sticker_id)
          .single();

        const newSenderQty = Math.max(0, (senderUs?.quantity ?? 0) - 1);
        
        await supabase
          .from("user_stickers")
          .upsert({
            user_id: itemSenderId,
            sticker_id: item.sticker_id,
            quantity: newSenderQty,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,sticker_id" });

        // 2. Add to receiver's inventory
        const { data: receiverUs } = await supabase
          .from("user_stickers")
          .select("quantity")
          .eq("user_id", itemReceiverId)
          .eq("sticker_id", item.sticker_id)
          .single();

        const newReceiverQty = (receiverUs?.quantity ?? 0) + 1;
        
        await supabase
          .from("user_stickers")
          .upsert({
            user_id: itemReceiverId,
            sticker_id: item.sticker_id,
            quantity: newReceiverQty,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,sticker_id" });
      }

      // Update status to completed
      const { error: requestError } = await supabase
        .from("trade_requests")
        .update({ status: "completed" })
        .eq("id", trade.id);

      if (requestError) {
        alert("Erro ao concluir a solicitação: " + requestError.message);
      } else {
        alert("Troca concluída e inventários atualizados com sucesso!");
        await loadTrades();
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro durante a conclusão.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendente</span>;
      case "accepted":
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Aceita</span>;
      case "rejected":
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Recusada</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Cancelada</span>;
      case "completed":
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Concluída</span>;
      default:
        return null;
    }
  };

  const tabTrades = trades.filter((t) => {
    if (activeTab === "received") {
      return t.receiver_id === currentUser?.id;
    } else {
      return t.sender_id === currentUser?.id;
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-[var(--primary)]" />
            Minhas Solicitações de Troca
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Acompanhe o andamento das propostas enviadas e recebidas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "received"
                ? "border-[var(--primary)] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Recebidas ({trades.filter((t) => t.receiver_id === currentUser?.id).length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "sent"
                ? "border-[var(--primary)] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Enviadas ({trades.filter((t) => t.sender_id === currentUser?.id).length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-sm animate-pulse">Carregando solicitações...</p>
          </div>
        ) : tabTrades.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-[var(--border-color)] text-center max-w-md mx-auto">
            <ClipboardList className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
            <h3 className="font-bold text-white text-base">Nenhuma Solicitação</h3>
            <p className="text-zinc-400 text-xs mt-1">
              Você não tem solicitações nesta aba no momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {tabTrades.map((trade) => {
              const partner = activeTab === "received" ? trade.sender : trade.receiver;
              const items = trade.trade_items || [];
              const offered = items.filter((item: any) => item.sender_id === trade.sender_id);
              const requested = items.filter((item: any) => item.sender_id === trade.receiver_id);

              return (
                <div key={trade.id} className="glass p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-6">
                  
                  {/* Header info */}
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                        Álbum: {trade.albums?.name}
                      </span>
                      <h3 className="font-bold text-white text-base mt-0.5">
                        Parceiro: {partner?.name}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Localização: {partner?.city} - {partner?.state}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(trade.status)}
                      <span className="text-[9px] text-zinc-500">
                        {new Date(trade.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* What sender offers */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                        Figurinhas Enviadas por {trade.sender?.name}:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {offered.map((item: any) => (
                          <span key={item.id} className="text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded">
                            {item.stickers?.number} - {item.stickers?.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* What receiver offers */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5">
                        Figurinhas Enviadas por {trade.receiver?.name}:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {requested.map((item: any) => (
                          <span key={item.id} className="text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded">
                            {item.stickers?.number} - {item.stickers?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-white/5 pt-4 flex flex-wrap justify-end gap-3">
                    
                    {/* Pending state */}
                    {trade.status === "pending" && activeTab === "received" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(trade.id, "rejected")}
                          disabled={processingId === trade.id}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          Recusar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(trade.id, "accepted")}
                          disabled={processingId === trade.id}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aceitar Proposta
                        </button>
                      </>
                    )}

                    {trade.status === "pending" && activeTab === "sent" && (
                      <button
                        onClick={() => handleUpdateStatus(trade.id, "cancelled")}
                        disabled={processingId === trade.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Cancelar Solicitação
                      </button>
                    )}

                    {/* Accepted state */}
                    {trade.status === "accepted" && (
                      <>
                        <Link
                          href={`/chat/${trade.id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Conversar no Chat
                        </Link>
                        
                        <button
                          onClick={() => handleCompleteTrade(trade)}
                          disabled={processingId === trade.id}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          Concluir Troca
                        </button>
                      </>
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
