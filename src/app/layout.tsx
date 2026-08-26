import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SimulationProvider } from "@/state/SimulationProvider";
import { Header } from "@/components/shell/Header";
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
 * Shell global: Header + coluna de conteúdo com largura máxima e gutters
 * consistentes (ver docs/06-design-system.md). SimulationProvider mora aqui
 * (não mais em page.tsx) porque o Header precisa do mesmo estado
 * compartilhado — ex. saber quando mostrar "Nova simulação". Isso não é uma
 * segunda instância de estado: é a mesma árvore, só com o provider um nível
 * acima.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SimulationProvider>
          <Header />
          <main className="mx-auto flex w-full max-w-[840px] flex-1 flex-col gap-8 px-6 py-10">
            {children}
          </main>
        </SimulationProvider>
      </body>
    </html>
  );
}
