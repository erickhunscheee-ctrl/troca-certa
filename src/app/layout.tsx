import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Troca Certa | Troque. Complete. Celebre.",
  description:
    "Organize seus álbuns, encontre colecionadores e complete suas coleções com trocas seguras.",

  icons: {
    icon: "/logo_troca.png",
    shortcut: "/logo_troca.png",
    apple: "/logo_troca.png",
  },

  openGraph: {
    title: "Troca Certa | Troque. Complete. Celebre.",
    description:
      "Organize seus álbuns, encontre colecionadores e complete suas coleções com trocas seguras.",
    url: "https://seu-dominio.com",
    siteName: "Troca Certa",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/logo_troca.png",
        width: 1200,
        height: 630,
        alt: "Logo Troca Certa",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Troca Certa | Troque. Complete. Celebre.",
    description:
      "Organize seus álbuns, encontre colecionadores e complete suas coleções com trocas seguras.",
    images: ["/logo_troca.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}