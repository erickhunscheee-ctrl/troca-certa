"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Coins, Zap, ShieldCheck, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-sm animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Plataforma inteligente para colecionadores</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-3xl leading-tight">
            Colecione, encontre matches e{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] via-indigo-400 to-[var(--accent)] bg-clip-text text-transparent">
              complete seu álbum
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
            O **Troca Certa** ajuda você a cruzar as suas figurinhas repetidas com as que você precisa. Negocie em tempo real com outros colecionadores.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.03] active:scale-95"
            >
              Começar a trocar
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors backdrop-blur-sm"
            >
              Entrar na minha conta
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl w-full text-left">
            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]">
                <Coins className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Álbum Inteligente</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Adicione suas figurinhas e veja na hora o que tem, o que falta e o que tem repetido.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
                <Zap className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Matchmaking Real</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Encontre usuários que precisam do que você tem repetido e que têm o que você precisa.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <MessageSquare className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Chat em Tempo Real</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Negocie os detalhes da troca e combine o ponto de encontro com o chat do Supabase Realtime.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col gap-3">
              <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-white text-lg">Troca Segura</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Confirme e conclua a troca diretamente no sistema para atualizar automaticamente os inventários.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500 bg-black/40">
        <p>© 2026 Troca Certa. Feito para colecionadores da Copa do Mundo 2026 e muito mais.</p>
      </footer>
    </div>
  );
}
