/**
 * Ícones de linha do shell — SVG inline, sem biblioteca (o projeto não
 * tinha nenhuma instalada; ver CLAUDE.md desta etapa, Parte 4). Sempre
 * usados ao lado de um rótulo em texto visível (label da Sidebar/BottomNav,
 * "Sair"/nome no menu de usuário) — por isso `aria-hidden="true"` já vem
 * embutido em cada um, em vez de depender de quem chama lembrar de passar.
 * `currentColor` para herdar a cor do texto ao lado (ativo/inativo já
 * resolvido pela classe de texto do elemento pai, sem estado duplicado).
 */

interface IconeProps {
  className?: string;
}

export function IconeHome({ className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  );
}

export function IconeSimulador({ className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 6h16" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <path d="M4 12h16" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M4 18h16" />
      <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeHistorico({ className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconeUsuario({ className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="8.5" r="3.25" />
      <path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" />
    </svg>
  );
}
