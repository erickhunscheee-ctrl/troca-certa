import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Coins, LogOut, User as UserIcon, MessageSquare, ClipboardList, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingTradesCount, setPendingTradesCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(false);
  
  const tradesChannelRef = useRef<any>(null);
  const messagesChannelRef = useRef<any>(null);
  const userRef = useRef<User | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      userRef.current = currentUser;
      setLoading(false);
      if (currentUser) {
        setupNotifications(currentUser);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      userRef.current = currentUser;
      setLoading(false);
      if (currentUser) {
        setupNotifications(currentUser);
      } else {
        cleanupNotifications();
      }
    });

    async function setupNotifications(currentUser: User) {
      // 1. Pending Trade Requests Count
      const fetchPendingCount = async () => {
        const { count, error } = await supabase
          .from("trade_requests")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", currentUser.id)
          .eq("status", "pending");
        if (!error && count !== null) {
          setPendingTradesCount(count);
        }
      };

      await fetchPendingCount();

      // Subscribe to trade_requests updates
      if (tradesChannelRef.current) {
        supabase.removeChannel(tradesChannelRef.current);
      }
      tradesChannelRef.current = supabase
        .channel(`user-trades-${currentUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "trade_requests",
          },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();

      // 2. Real-time message checking
      // Subscribe to messages in chats the user belongs to
      // First, get all chats where user is sender or receiver of the trade_request
      const fetchChatsAndSubscribe = async () => {
        const { data: trades, error } = await supabase
          .from("trade_requests")
          .select("id")
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

        if (error || !trades || trades.length === 0) return;

        const tradeIds = trades.map((t) => t.id);

        const { data: chats } = await supabase
          .from("chats")
          .select("id")
          .in("trade_request_id", tradeIds);

        if (!chats || chats.length === 0) return;

        const chatIds = chats.map((c) => c.id);

        if (messagesChannelRef.current) {
          supabase.removeChannel(messagesChannelRef.current);
        }

        messagesChannelRef.current = supabase
          .channel(`user-messages-${currentUser.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            (payload) => {
              const newMsg = payload.new;
              // Check if message belongs to one of user's active chats
              // and was not sent by the user themselves
              if (
                chatIds.includes(newMsg.chat_id) &&
                newMsg.sender_id !== currentUser.id &&
                !window.location.pathname.includes(`/chat/`)
              ) {
                setUnreadMessages(true);
              }
            }
          )
          .subscribe();
      };

      await fetchChatsAndSubscribe();
    }

    function cleanupNotifications() {
      if (tradesChannelRef.current) {
        supabase.removeChannel(tradesChannelRef.current);
        tradesChannelRef.current = null;
      }
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      setPendingTradesCount(0);
      setUnreadMessages(false);
    }

    return () => {
      subscription.unsubscribe();
      cleanupNotifications();
    };
  }, []);

  // Clear unread message notification if user navigates to trades or chat
  useEffect(() => {
    if (pathname.includes("/trades") || pathname.includes("/chat")) {
      setUnreadMessages(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-md shadow-[var(--primary)]/20">
                <Coins className="h-5 w-5" />
              </span>
              <span>Troca <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">Certa</span></span>
            </Link>

            {user && !loading && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                     pathname === "/dashboard"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/albums"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/albums") || isActive("/album")
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Álbuns
                </Link>
                <Link
                  href="/trades"
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/trades") || isActive("/chat")
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Trocas
                  {pendingTradesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {pendingTradesCount}
                    </span>
                  )}
                  {unreadMessages && (
                    <span className="absolute top-1 right-2 flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/profile"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/profile")
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <UserIcon className="h-4 w-4 text-[var(--primary)]" />
                      <span className="hidden sm:inline">Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Sair</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/10 transition-all hover:scale-[1.02]"
                    >
                      Criar Conta
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile menu (always simple links just in case) */}
        {user && !loading && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5 text-xs">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center gap-1 ${
                pathname === "/dashboard" ? "text-white" : "text-zinc-400"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Painel</span>
            </Link>
            <Link
              href="/albums"
              className={`flex flex-col items-center gap-1 ${
                isActive("/albums") || isActive("/album") ? "text-white" : "text-zinc-400"
              }`}
            >
              <span>Álbuns</span>
            </Link>
            <Link
              href="/trades"
              className={`relative flex flex-col items-center gap-1 ${
                isActive("/trades") || isActive("/chat") ? "text-white" : "text-zinc-400"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Trocas</span>
              {pendingTradesCount > 0 && (
                <span className="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingTradesCount}
                </span>
              )}
              {unreadMessages && (
                <span className="absolute top-0 right-4 flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </Link>
            <Link
              href="/profile"
              className={`flex flex-col items-center gap-1 ${
                isActive("/profile") ? "text-white" : "text-zinc-400"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
