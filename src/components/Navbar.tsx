"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Coins, LogOut, User as UserIcon, MessageSquare, ClipboardList, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/trades")
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Trocas
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
              className={`flex flex-col items-center gap-1 ${
                isActive("/trades") ? "text-white" : "text-zinc-400"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Trocas</span>
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
