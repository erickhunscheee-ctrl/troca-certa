export type ToastVariant = "error" | "success" | "info";

export type ToastPayload = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

export const TOAST_EVENT = "troca-certa:toast";

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function showErrorToast(message: string, title = "Erro") {
  showToast({
    title,
    message,
    variant: "error",
  });
}

export function showSuccessToast(message: string, title = "Tudo certo") {
  showToast({
    title,
    message,
    variant: "success",
  });
}
