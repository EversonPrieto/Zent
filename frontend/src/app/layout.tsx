import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";
import DialogProvider from "../components/DialogProvider";
import CommandPaletteProvider from "../components/CommandPaletteProvider";
import ThemeProvider from "../components/ThemeProvider";
import { ThemeContextProvider } from "../contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zent - Gestão de projetos para times modernos",
    template: "%s | Zent",
  },
  description: "Organize projetos, tarefas e colaboração em um só lugar. Zent ajuda equipes a planejar projetos, acompanhar tarefas e centralizar a operação do time.",
  keywords: ["gestão de projetos", "kanban", "tarefas", "produtividade", "colaboração", "workspace", "times", "agile"],
  authors: [{ name: "Zent Team" }],
  creator: "Zent",
  publisher: "Zent",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://zent.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Zent - Gestão de projetos para times modernos",
    description: "Organize projetos, tarefas e colaboração em um só lugar. Kanban, comentários e muito mais.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Zent",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zent - Plataforma de gestão de projetos",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zent - Gestão de projetos",
    description: "Organize seu time com a melhor plataforma de gestão de projetos.",
    images: ["/og-image.png"],
    creator: "@zentapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/logo.png",
      },
    ],
  },
  manifest: "/manifest.json",
  // viewport, themeColor e colorScheme agora são exportados separadamente
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  { media: "(prefers-color-scheme: dark)", color: "#09090b" },
];

export const colorScheme = "dark light";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white`}
        suppressHydrationWarning
      >
        <ThemeContextProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
            <DialogProvider />
            <CommandPaletteProvider />
          </ThemeProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}