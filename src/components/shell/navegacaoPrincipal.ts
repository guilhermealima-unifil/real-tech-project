/**
 * Itens e helpers da navegação global (Sidebar desktop + BottomNav mobile)
 * — definidos uma única vez, consumidos pelos dois, para nunca divergirem
 * (mesmos destinos, mesmo rótulo, mesma regra de "rota ativa"). Módulo sem
 * JSX/React de propósito: só dados e uma função pura, fácil de testar sem
 * nenhuma infraestrutura de teste de componente.
 *
 * "Home" (`/`) passou a ser a Home/Dashboard de verdade nesta etapa (antes
 * só redirecionava para `/simulador`, e por isso ficava fora desta lista —
 * ver histórico do arquivo). Público, sem `requerAutenticacao`: o
 * simulador continua público, e a Home também precisa funcionar deslogada.
 */

export type IconeNavegacao = "home" | "simulador" | "historico";

export interface ItemNavegacao {
  /** Rótulo completo — usado na Sidebar (desktop, mais espaço). */
  rotulo: string;
  /** Rótulo compacto — usado na BottomNav (mobile). Cai para `rotulo` quando ausente. */
  rotuloCurto?: string;
  href: string;
  icone: IconeNavegacao;
  /** true = a rota em si já exige sessão (ver src/app/historico/page.tsx) — deslogado é redirecionado para /login. */
  requerAutenticacao?: boolean;
}

export const ITENS_NAVEGACAO_PRINCIPAL: ItemNavegacao[] = [
  { rotulo: "Home", href: "/", icone: "home" },
  { rotulo: "Simulador", rotuloCurto: "Simular", href: "/simulador", icone: "simulador" },
  { rotulo: "Histórico", href: "/historico", icone: "historico", requerAutenticacao: true },
];

/**
 * Destino efetivo de um item — igual a `item.href`, exceto quando a rota
 * exige sessão e o usuário está deslogado, caso em que aponta direto para
 * `/login` (mesmo comportamento que o Header.tsx anterior já tinha para
 * "Histórico": nunca um link morto, sempre um destino que faz sentido).
 */
export function hrefEfetivo(item: ItemNavegacao, autenticado: boolean): string {
  if (item.requerAutenticacao && !autenticado) return "/login";
  return item.href;
}

/**
 * Um item é "ativo" quando a rota atual é exatamente `href`, ou um
 * sub-caminho dele (`/historico/abc123` ativa o item de `href: "/historico"`).
 * Comparação sempre contra o `href` canônico do item — nunca contra o
 * destino redirecionado por `hrefEfetivo` (deslogado em `/login` nunca
 * deveria acender "Histórico", mas também nunca chega lá: a própria rota
 * /historico redireciona para /login antes de renderizar, ver
 * src/app/historico/page.tsx).
 */
export function itemNavegacaoAtivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
