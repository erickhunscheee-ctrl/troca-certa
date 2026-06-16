"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send, PhoneCall } from "lucide-react";

export default function ChatPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = use(params);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [trade, setTrade] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeChannelRef = useRef<any>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadChatDetails() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setCurrentUser(session.user);

      // Load trade request details
      const { data: tradeData, error: tradeError } = await supabase
        .from("trade_requests")
        .select(`
          id,
          status,
          sender_id,
          receiver_id,
          sender:profiles!trade_requests_sender_id_fkey(id, name, city, state, whatsapp),
          receiver:profiles!trade_requests_receiver_id_fkey(id, name, city, state, whatsapp)
        `)
        .eq("id", tradeId)
        .single();

      if (tradeError || !tradeData) {
        console.error("Error loading trade", tradeError);
        router.push("/trades");
        return;
      }

      // Ensure user is part of this trade
      if (tradeData.sender_id !== session.user.id && tradeData.receiver_id !== session.user.id) {
        router.push("/trades");
        return;
      }

      setTrade(tradeData);
      const isSender = tradeData.sender_id === session.user.id;
      setPartner(isSender ? tradeData.receiver : tradeData.sender);

      // Load or create chat (using safe array queries instead of .single() to avoid PGRST116 errors)
      let { data: chatsList, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("trade_request_id", tradeId);

      let chatData = chatsList && chatsList.length > 0 ? chatsList[0] : null;

      if (!chatData) {
        // Chat not found, let's insert it
        const { data: newChat, error: createError } = await supabase
          .from("chats")
          .insert({ trade_request_id: tradeId })
          .select();

        if (createError) {
          console.error("Error creating chat row", createError);
          return;
        }
        chatData = newChat && newChat.length > 0 ? newChat[0] : null;
      }

      setChat(chatData);

      if (chatData) {
        // Load existing messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatData.id)
          .order("created_at", { ascending: true });

        setMessages(messagesData || []);

        // Clean up existing channel if active before subscribing
        if (activeChannelRef.current) {
          supabase.removeChannel(activeChannelRef.current);
        }

        // Subscribe to messages in real-time
        const channel = supabase
          .channel(`chat-messages-${chatData.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `chat_id=eq.${chatData.id}`,
            },
            (payload) => {
              setMessages((prev) => {
                // Prevent duplicates
                if (prev.some((msg) => msg.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            }
          )
          .subscribe();

        activeChannelRef.current = channel;
        setLoading(false);
      }
    }

    loadChatDetails();

    return () => {
      if (activeChannelRef.current) {
        const channelToClean = activeChannelRef.current;
        supabase.removeChannel(channelToClean);
        activeChannelRef.current = null;
      }
    };
  }, [tradeId, router]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat || !currentUser) return;

    const msgContent = newMessage.trim();
    setNewMessage(""); // optimistic clear

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          sender_id: currentUser.id,
          content: msgContent,
        });

      if (error) {
        console.error("Error sending message", error);
        alert("Erro ao enviar mensagem: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Abrindo chat...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Chat Header */}
        <div className="glass p-4 rounded-t-2xl border-x border-t border-[var(--border-color)] flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-3">
            <Link
              href="/trades"
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {partner?.name}
              </h3>
              <p className="text-xs text-zinc-400">
                {partner?.city} - {partner?.state}
              </p>
            </div>
          </div>

          {partner?.whatsapp && (
            <a
              href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chamar no WhatsApp</span>
            </a>
          )}
        </div>

        {/* Messages list */}
        <div className="flex-1 glass border-x border-b border-[var(--border-color)] p-4 overflow-y-auto flex flex-col gap-3 min-h-0 bg-black/20">
          {messages.length === 0 ? (
            <div className="my-auto text-center p-4">
              <p className="text-zinc-500 text-xs">Nenhuma mensagem enviada ainda.</p>
              <p className="text-zinc-500 text-[10px] mt-1">
                Combine o local de encontro, dia e horário para realizar a troca física!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "self-end bg-[var(--primary)] text-white rounded-br-none"
                      : "self-start bg-white/5 border border-white/5 text-zinc-200 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.content}</p>
                  <span className={`text-[9px] mt-1 text-right block ${
                    isMe ? "text-white/60" : "text-zinc-500"
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="mt-3 flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem para combinar a troca..."
            className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            required
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white font-bold transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </main>
    </div>
  );
}
