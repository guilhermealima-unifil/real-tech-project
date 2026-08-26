/**
 * O que a tecla Enter deve fazer dentro do `<form>` único do wizard —
 * causa raiz do bug de pular a Etapa Mercado (ver CLAUDE.md/commit da
 * correção): navegadores submetem um `<form>` ao pressionar Enter num
 * `<input>`/`<select>` mesmo sem nenhum `<button type="submit">` presente
 * no DOM naquele momento. Nas Etapas Operação/Margens isso disparava
 * `executarSimulacao()` direto, ignorando a validação de progressão e — a
 * partir do momento em que o formulário já tinha todos os campos
 * obrigatórios preenchidos (Etapa 3 é toda opcional) — completando a
 * simulação de verdade e pulando a Etapa Mercado.
 *
 * Regra: Enter deve significar exatamente o mesmo que o botão primário
 * visível na etapa atual — "Continuar" fora da última etapa, "Simular
 * faixa viável" na última. Nunca interfere na ativação nativa de um botão
 * focado (Voltar/Nova simulação/casos reais já tratam Enter sozinhos).
 */
export type AcaoTeclaEnter = "avancar" | "submeter-nativo" | "ignorar";

export function decidirAcaoEnter(params: {
  eUltimaEtapa: boolean;
  tagNameAlvo: string;
}): AcaoTeclaEnter {
  if (params.tagNameAlvo === "BUTTON") return "ignorar";
  if (params.eUltimaEtapa) return "submeter-nativo";
  return "avancar";
}
