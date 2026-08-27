/**
 * Ícones de linha específicos do Resultado — mesmo estilo/convenção de
 * src/components/shell/icones.tsx (SVG inline, sem biblioteca nova;
 * `aria-hidden="true"` já embutido; `currentColor` herda a cor do texto ao
 * lado), só que vivem no domínio de simulação em vez do shell global:
 * usados pelas ações compactas do header sticky (Salvar/Editar/Nova em
 * ícone no mobile, ver ConteudoAcaoResponsivo em HeaderAnalise.tsx) e pelo
 * toggle de "ver mais" ("Ver todos os dados" em PremissasSimulacao.tsx).
 */

interface IconeProps {
  className?: string;
}

export function IconeSalvar({ className }: IconeProps) {
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
      <path d="M5 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M8 4v5h6V4" />
      <path d="M7.5 14h9v6h-9z" />
    </svg>
  );
}

export function IconeEditar({ className }: IconeProps) {
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
      <path d="M16.86 3.49a2.06 2.06 0 0 1 2.91 2.91L7.5 18.68 3 20l1.32-4.5L16.86 3.49Z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  );
}

export function IconeNovo({ className }: IconeProps) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** Seta de expandir/recolher — sobe/desce via `rotate-180` de quem chama, conforme `aria-expanded`. */
export function IconeChevron({ className }: IconeProps) {
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
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
