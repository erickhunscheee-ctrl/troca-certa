"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { TOAST_EVENT, ToastPayload, ToastVariant } from "@/lib/toast";

type Toast = Required<Pick<ToastPayload, "message" | "variant" | "duration">> &
  Pick<ToastPayload, "title"> & {
    id: number;
  };

const variantStyles: Record<
  ToastVariant,
  {
    icon: typeof AlertTriangle;
    iconClass: string;
    borderClass: string;
    title: string;
  }
> = {
  error: {
    icon: AlertTriangle,
    iconClass: "bg-red-50 text-red-600",
    borderClass: "border-l-red-500",
    title: "Erro",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    borderClass: "border-l-emerald-500",
    title: "Tudo certo",
  },
  info: {
    icon: Info,
    iconClass: "bg-blue-50 text-[var(--primary)]",
    borderClass: "border-l-[var(--primary)]",
    title: "Aviso",
  },
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;

      if (!detail?.message) {
        return;
      }

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const toast: Toast = {
        id,
        title: detail.title,
        message: detail.message,
        variant: detail.variant ?? "info",
        duration: detail.duration ?? 4800,
      };

      setToasts((current) => [toast, ...current].slice(0, 4));
      window.setTimeout(() => dismissToast(id), toast.duration);
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
    };
  }, [dismissToast]);

  return (
    <>
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--border-color)] border-l-4 ${style.borderClass} bg-white p-4 text-left shadow-2xl shadow-[var(--brand-navy)]/15`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[var(--brand-navy)]">
                  {toast.title || style.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--brand-slate)]">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar aviso"
                className="rounded-lg p-1 text-[var(--brand-slate)] transition-colors hover:bg-[#eef4ff] hover:text-[var(--brand-navy)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
