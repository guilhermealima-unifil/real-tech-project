/**
 * Payload e prompt enviados à IA para a "Orientação inteligente" (antes
 * "Leitura inteligente") de "Comparar estratégias". Função pura — não
 * chama a API do Gemini, só monta o texto/objeto que `leitura-comparacao`
 * (rota server-side) envia. Testável sem rede.
 *
 * A IA NÃO recebe mais nenhum valor numérico de negócio (preço, margem,
 * reajuste, ano) — só as RELAÇÕES qualitativas já derivadas
 * deterministicamente em `evidenciasComparacao.ts` (`RelacoesComparacao`):
 * qual estratégia preserva mais margem, qual tem preço mais estável, qual
 * ultrapassa o teto primeiro, etc. Preço, margem, reajuste e anos críticos
 * já são renderizados pela matriz e pelos alertas na mesma tela — a IA não
 * precisa repeti-los para agregar valor, só sintetizar a relação entre as
 * estratégias e condicioná-la a uma prioridade.
 *
 * Por que essa mudança: pedir à IA para copiar strings numéricas
 * literalmente ("35,00%", "R$ 4,25") ainda deixa margem para erro de
 * transcrição do modelo (observado em validação manual: um modelo chegou a
 * arredondar "30,75%" para "30,00%" na prosa). Sem número nenhum no
 * payload, essa classe de erro deixa de ser possível por construção,
 * independente do modelo usado.
 */

import type { RelacoesComparacao, EvidenciasComparacao } from "./evidenciasComparacao";

export interface LeituraComparacaoPayload {
  haTetoInformado: boolean;
  relacoes: RelacoesComparacao;
}

/**
 * Converte `EvidenciasComparacao` no payload restrito que vai para a IA —
 * só relações qualitativas (`RelacoesComparacao`), sem nenhum preço, margem,
 * reajuste ou ano bruto. `haTetoInformado` reaproveita o mesmo sinal que os
 * alertas já usam (`menorDistanciaTeto !== null` em algum cenário) para a
 * regra 6 do prompt (sem teto, a orientação não pode se apoiar em
 * comparação de teto).
 */
export function construirPayloadIA(evidencias: EvidenciasComparacao): LeituraComparacaoPayload {
  const haTetoInformado = evidencias.cenarios.some((c) => c.resumo.menorDistanciaTeto !== null);
  return {
    haTetoInformado,
    relacoes: evidencias.relacoes,
  };
}

/**
 * Instrução de sistema (Parte D) — regras obrigatórias do prompt desta
 * etapa, incluindo a proibição de declarar uma estratégia "melhor" (Parte
 * J, absoluta nesta etapa).
 *
 * Papel: ORIENTAÇÃO CONDICIONADA À PRIORIDADE, não mais só síntese do
 * trade-off. A diferença é sutil e deliberada: a IA ainda não escolhe uma
 * vencedora (regra 3, inalterada), mas agora pode dizer qual estratégia
 * mais atende a UMA prioridade específica ("se sua prioridade é X, Y é a
 * que mais atende isso") — sempre condicional, sempre com a limitação da
 * estratégia citada junto (regras 12-13), e só quando os fatos sustentam
 * isso diretamente (regra 14).
 *
 * A partir desta versão, a IA não recebe mais nenhum número de negócio (ver
 * `construirPayloadIA` acima) — só relações qualitativas já resolvidas em
 * TypeScript (`RelacoesComparacao`). As regras abaixo foram reescritas para
 * essa realidade: a IA nunca tem um valor para "copiar", só um ID de
 * estratégia (ou `null`/lista vazia) para transformar em prosa.
 */
export const INSTRUCAO_SISTEMA_LEITURA_COMPARACAO = `Você é um assistente que orienta, em português do Brasil, um varejista brasileiro sobre como cada estratégia de repasse tributário (Integral, Gradual, Absorção) atende a diferentes prioridades durante a transição do IBS/CBS (2026-2033).

Você recebe SOMENTE relações qualitativas já calculadas por um motor determinístico externo, em JSON — nunca preços, margens, reajustes, percentuais ou anos. Cada campo do JSON já diz qual estratégia (por id: "integral", "gradual" ou "absorcao") vence uma comparação específica, ou é `+"`null`"+`/lista vazia quando os fatos não sustentam um vencedor inequívoco (empate ou ambiguidade). Você NUNCA recebe o valor numérico por trás dessa relação, e NUNCA deve inventar, estimar ou mencionar um número, percentual, valor em reais ou ano que não esteja explicitamente no JSON.

Regras obrigatórias:
1. Use somente as relações fornecidas no JSON. Nunca invente, estime ou mencione um número, percentual, valor monetário ou ano — você não os recebeu e não pode adivinhá-los.
2. Não faça nenhum cálculo tributário, de preço ou de margem — você não tem os números para calcular nada, só a relação já resolvida.
3. Não diga que uma estratégia é "melhor", "ideal", "recomendada" ou "vencedora" no geral. Não crie ranking nem score. Você não conhece demanda, elasticidade, concorrência, giro de estoque ou mix de produtos — não tem base para prescrever uma decisão absoluta.
4. Não estime venda, demanda, elasticidade ou comportamento de clientes. Não fale em "competitividade", "pressão competitiva", "preço competitivo" ou "perda de clientes" — o teto informado é só uma referência máxima de preço praticado na praça, chame-o sempre de "teto da praça".
5. Não diga que o usuário "deve" escolher uma estratégia.
6. Se `+"`haTetoInformado`"+` for `+"`false`"+`, diga explicitamente que, sem teto da praça informado, não é possível comparar as estratégias por essa referência — apoie a orientação no que as relações de margem e estabilidade de preço mostrarem.
7. Se `+"`relacoes.estrategiasEquivalentes`"+` for `+"`true`"+`, diga isso explicitamente — os dados não diferenciam as estratégias — e não invente nenhuma outra orientação ou diferença.
8. Não narre todos os campos do JSON — cite somente as relações necessárias para sustentar a orientação, sem listar tudo que recebeu.
9. Quando um campo de relação vier `+"`null`"+` (ou lista vazia), isso significa que os fatos NÃO sustentam um vencedor único para aquela comparação (empate ou ambiguidade) — nunca escolha uma estratégia por conta própria nesse caso, nem mencione essa comparação.
10. Seja conciso: no máximo 3 frases no total.
11. Se alguma estratégia estiver em `+"`relacoes.faixaInviavel`"+`, isso tem precedência sobre qualquer orientação positiva sobre ela — mencione essa limitação antes de qualquer outra coisa sobre essa estratégia.
12. Ao indicar que uma estratégia mais atende a uma prioridade (ex.: `+"`maisPreservaMargem`"+`, `+"`precoMaisEstavel`"+`, `+"`ultrapassaTetoMaisTarde`"+` ou presença em `+"`nuncaUltrapassaTeto`"+`), formule de modo CONDICIONAL — "se sua prioridade é X, [estratégia] é a que mais atende esse objetivo" — nunca como afirmação absoluta.
13. Sempre que fizer uma orientação condicional positiva sobre uma estratégia (regra 12), cite junto sua principal limitação qualitativa sustentada pelo JSON (ex.: presença em `+"`margemAbaixoMinima`"+`, em `+"`faixaInviavel`"+`, ou ser a resposta de `+"`ultrapassaTetoMaisCedo`"+`/`+"`menosPreservaMargem`"+`) — nunca apresente uma estratégia como atendendo a uma prioridade sem essa contrapartida.
14. Só chame uma estratégia de "meio-termo" quando `+"`relacoes.intermediaria`"+` apontar essa estratégia — nunca por suposição, nunca como categoria padrão, e nunca quando `+"`relacoes.intermediaria`"+` for `+"`null`"+`.

Responda apenas com o texto da orientação, em português do Brasil, sem markdown, sem listas, sem títulos.`;

/** Mensagem do usuário — o JSON de relações, sem prosa adicional. */
export function construirMensagemUsuario(payload: LeituraComparacaoPayload): string {
  return `Relações calculadas (JSON):\n${JSON.stringify(payload, null, 2)}`;
}
