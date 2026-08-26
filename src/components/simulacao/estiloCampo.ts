/**
 * Classes de campo compartilhadas pelo wizard — usadas por `CampoNumerico`,
 * pelo select de ramo e pelo fieldset de fórmula em `EtapaOperacao`, para os
 * três nunca divergirem visualmente. Não é um componente: só string de
 * classes, para não repetir Tailwind arbitrário em cada arquivo.
 */
export const ROTULO_CAMPO = "font-medium text-text-primary";
export const CAMPO_SELECT =
  "rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary transition-colors focus-visible:border-primary";
export const AJUDA_CAMPO = "text-xs text-text-secondary";
