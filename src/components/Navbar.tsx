import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Check, ClipboardList, LayoutDashboard, LogOut, RefreshCw, User as UserIcon } from "lucide-react";
import { showErrorToast } from "@/lib/toast";

type RealtimeChannel = ReturnType<typeof supabase.channel>;

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingTradesCount, setPendingTradesCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(false);
  
  const tradesChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const notificationsUserIdRef = useRef<string | null>(null);
  const setupRunRef = useRef(0);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) {
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        void setupNotifications(currentUser);
      }
    }).catch((error) => {
      console.error("Error loading session", error);
      showErrorToast("Nao foi possivel carregar sua sessao.");
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        void setupNotifications(currentUser);
      } else {
        void cleanupNotifications();
      }
    });

    async function removeRealtimeChannels() {
      const tradesChannel = tradesChannelRef.current;
      const messagesChannel = messagesChannelRef.current;

      tradesChannelRef.current = null;
      messagesChannelRef.current = null;

      await Promise.all([
        tradesChannel ? supabase.removeChannel(tradesChannel) : Promise.resolve(null),
        messagesChannel ? supabase.removeChannel(messagesChannel) : Promise.resolve(null),
      ]);
    }

    async function setupNotifications(currentUser: User) {
      if (notificationsUserIdRef.current === currentUser.id) {
        return;
      }

      const runId = setupRunRef.current + 1;
      setupRunRef.current = runId;
      notificationsUserIdRef.current = currentUser.id;

      await removeRealtimeChannels();

      if (!mounted || runId !== setupRunRef.current) {
        return;
      }

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

      if (!mounted || runId !== setupRunRef.current) {
        return;
      }

      // Subscribe to trade_requests updates
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

        if (!mounted || runId !== setupRunRef.current) {
          return;
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

    async function cleanupNotifications() {
      setupRunRef.current += 1;
      notificationsUserIdRef.current = null;
      await removeRealtimeChannels();
      setPendingTradesCount(0);
      setUnreadMessages(false);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      void cleanupNotifications();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const showUnreadMessages =
    unreadMessages && !pathname.includes("/trades") && !pathname.includes("/chat");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display flex items-center gap-3 text-xl font-extrabold tracking-normal text-[var(--brand-navy)]">
              <span className="relative block h-10 w-12 shrink-0">
                <span className="absolute left-0 top-1 flex h-8 w-8 rotate-[-10deg] items-center justify-center rounded-lg bg-[var(--brand-navy)] text-white shadow-md">
                  <RefreshCw className="h-4.5 w-4.5" />
                </span>
                <span className="absolute right-0 top-1 flex h-8 w-8 rotate-[10deg] items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-md">
                  <Check className="h-4.5 w-4.5" />
                </span>
              </span>
              <span className="leading-none">
                Troca <span className="block text-[var(--primary)] sm:inline">Certa</span>
              </span>
            </Link>

            {user && !loading && (
              <div className="hidden items-center gap-1 rounded-full border border-[var(--border-color)] bg-[#f8fafc] p-1 md:flex">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                     pathname === "/dashboard"
                      ? "bg-white text-[var(--primary)] shadow-sm"
                      : "text-[var(--brand-slate)] hover:bg-white hover:text-[var(--brand-navy)]"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/albums"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                    isActive("/albums") || isActive("/album")
                      ? "bg-white text-[var(--primary)] shadow-sm"
                      : "text-[var(--brand-slate)] hover:bg-white hover:text-[var(--brand-navy)]"
                  }`}
                >
                  Álbuns
                </Link>
                <Link
                  href="/trades"
                  onClick={() => setUnreadMessages(false)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                    isActive("/trades") || isActive("/chat")
                      ? "bg-white text-[var(--primary)] shadow-sm"
                      : "text-[var(--brand-slate)] hover:bg-white hover:text-[var(--brand-navy)]"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Trocas
                  {pendingTradesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {pendingTradesCount}
                    </span>
                  )}
                  {showUnreadMessages && (
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
                      className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                        isActive("/profile")
                          ? "bg-[#eef4ff] text-[var(--primary)]"
                          : "text-[var(--brand-slate)] hover:bg-[#eef4ff] hover:text-[var(--brand-navy)]"
                      }`}
                    >
                      <UserIcon className="h-4 w-4 text-[var(--primary)]" />
                      <span className="hidden sm:inline">Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-[#ff7a00] transition-colors hover:bg-orange-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Sair</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="rounded-full px-4 py-2 text-sm font-bold text-[var(--brand-slate)] transition-colors hover:bg-[#eef4ff] hover:text-[var(--brand-navy)]"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[var(--brand-navy)]/10 transition-all hover:bg-[var(--primary)]"
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
          <div className="flex items-center justify-around border-t border-[var(--border-color)] py-2 text-xs md:hidden">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center gap-1 font-bold ${
                pathname === "/dashboard" ? "text-[var(--primary)]" : "text-[var(--brand-slate)]"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Painel</span>
            </Link>
            <Link
              href="/albums"
              className={`flex flex-col items-center gap-1 font-bold ${
                isActive("/albums") || isActive("/album") ? "text-[var(--primary)]" : "text-[var(--brand-slate)]"
              }`}
            >
              <span>Álbuns</span>
            </Link>
            <Link
              href="/trades"
              onClick={() => setUnreadMessages(false)}
              className={`relative flex flex-col items-center gap-1 font-bold ${
                isActive("/trades") || isActive("/chat") ? "text-[var(--primary)]" : "text-[var(--brand-slate)]"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Trocas</span>
              {pendingTradesCount > 0 && (
                <span className="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingTradesCount}
                </span>
              )}
              {showUnreadMessages && (
                <span className="absolute top-0 right-4 flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </Link>
            <Link
              href="/profile"
              className={`flex flex-col items-center gap-1 font-bold ${
                isActive("/profile") ? "text-[var(--primary)]" : "text-[var(--brand-slate)]"
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
