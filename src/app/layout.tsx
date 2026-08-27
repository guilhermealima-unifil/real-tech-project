import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/state/AuthProvider";
import { SimulationProvider } from "@/state/SimulationProvider";
import { AppShell } from "@/components/shell/AppShell";
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
  title: "Real Tech — Simulador de preço IBS/CBS",
  description: "Faixa viável de preço, desconto e recomendação em cada ano da transição IBS/CBS.",
};

/**
 * Shell global: AppShell decide entre a navegação completa (Sidebar
 * desktop + BottomNav mobile) e as telas de entrada sem navegação
 * (login/cadastro) — ver src/components/shell/AppShell.tsx. Substituiu o
 * antigo Header horizontal (ver CLAUDE.md desta etapa, Parte 11).
 * SimulationProvider continua aqui, não em simulador/page.tsx (decisão de
 * etapas anteriores, não revisitada agora) — nenhum componente do shell
 * novo (Sidebar/BottomNav/MenuUsuario) precisa desse estado, só o
 * simulador em si; mantê-lo no layout evita reintroduzir o provider mais
 * abaixo sem necessidade.
 *
 * AuthProvider é irmão de SimulationProvider, por fora — autenticação e
 * simulação são estados independentes (o simulador continua público e
 * funcional sem login); nenhum dos dois lê o estado do outro.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>
          <SimulationProvider>
            <AppShell>{children}</AppShell>
          </SimulationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
