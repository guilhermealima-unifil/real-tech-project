"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { formatarPct, formatarReais } from "@/lib/frases";
import { IconeChevron } from "./icones";
import { formatarFaixaPraca, rotuloModelo, type PremissasDados } from "./premissas";

interface PremissasSimulacaoProps {
  dados: PremissasDados;
}

const ROTULO_VALOR = "text-xs text-muted";
const TEXTO_VALOR = "font-figures mt-0.5 text-sm font-medium text-text-primary";

/**
 * Auditabilidade da recomendação: "com quais dados essa decisão foi
 * tomada?" (ver CLAUDE.md desta etapa). Fica logo ABAIXO do header sticky
 * decisório e ANTES do conteúdo das abas — nunca dentro do sticky (que
 * precisa continuar pequeno) e rola normalmente com a página.
 *
 * Somente leitura, de propósito: nenhum campo aqui é editável, e
 * deliberadamente NÃO existe nenhum atalho para "Editar dados" — o header
 * sticky já sempre mostra essa ação (texto no desktop, ícone no mobile,
 * ver HeaderAnalise.tsx); duplicar o CTA aqui seria redundante, o objetivo
 * deste componente é referência visual dos dados, não mais um botão. Isso
 * também é o que permite reusar exatamente o mesmo componente no histórico
 * (ver DetalheSimulacaoSalva.tsx) sem nenhuma prop a mais para
 * ligar/desligar edição — não tem o que desligar.
 *
 * `dados` (PremissasDados, ver premissas.ts) é sempre um SNAPSHOT do que
 * efetivamente gerou o resultado na tela — nunca `state.form` ao vivo, que
 * o usuário pode ter editado sem recalcular. Quem chama decide a fonte:
 * `resultado.entradaSnapshot` na simulação ao vivo, os campos já achatados
 * de `SimulacaoDetalhe` no histórico.
 */
export function PremissasSimulacao({ dados }: PremissasSimulacaoProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Premissas</h2>
        <button
          type="button"
          aria-expanded={expandido}
          aria-controls="premissas-todos-os-dados"
          onClick={() => setExpandido((atual) => !atual)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expandido ? "Ocultar dados" : "Ver todos os dados"}
          <IconeChevron
            className={"h-3.5 w-3.5 shrink-0 transition-transform " + (expandido ? "rotate-180" : "")}
          />
        </button>
      </div>

      {/* Resumo permanente — desktop numa faixa (flex-wrap), mobile em grid 2x2. */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-0">
        <ItemPremissa rotulo="Custo de compra" valor={`R$ ${formatarReais(dados.custoCompra)}`} />
        <ItemPremissa
          rotulo="Margem mínima"
          valor={`${formatarPct(dados.margemMinimaPct / 100)}%`}
        />
        <ItemPremissa
          rotulo="Praça"
          valor={formatarFaixaPraca(dados.tetoPracaMin, dados.tetoPracaMax)}
        />
        <ItemPremissa rotulo="Modelo" valor={rotuloModelo(dados.formulaTipo)} />
      </div>

      {expandido && (
        <div
          id="premissas-todos-os-dados"
          className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
        >
          <GrupoPremissas titulo="Operação">
            <ItemPremissa rotulo="Custo de compra" valor={`R$ ${formatarReais(dados.custoCompra)}`} />
            {dados.ramoRotulo && <ItemPremissa rotulo="Ramo" valor={dados.ramoRotulo} />}
            <ItemPremissa rotulo="Tipo de fórmula" valor={rotuloModelo(dados.formulaTipo)} />
          </GrupoPremissas>

          <GrupoPremissas titulo="Margens">
            {dados.formulaTipo === "multiplicador" && dados.despesaFixaPct !== null && (
              <ItemPremissa
                rotulo="Despesa fixa"
                valor={`${formatarPct(dados.despesaFixaPct / 100)}%`}
              />
            )}
            {dados.formulaTipo === "markup" && dados.markupPct !== null && (
              <ItemPremissa rotulo="Markup" valor={`${formatarPct(dados.markupPct / 100)}%`} />
            )}
            {dados.formulaTipo === "multiplicador" && (
              <ItemPremissa
                rotulo="Margem-alvo"
                valor={`${formatarPct(dados.margemAlvoPct / 100)}%`}
              />
            )}
            <ItemPremissa
              rotulo="Margem mínima"
              valor={`${formatarPct(dados.margemMinimaPct / 100)}%`}
            />
            {dados.prazoPagamentoFornecedorDias !== null && (
              <ItemPremissa
                rotulo="Prazo do fornecedor"
                valor={`${dados.prazoPagamentoFornecedorDias} dias`}
              />
            )}
          </GrupoPremissas>

          <GrupoPremissas titulo="Mercado">
            {dados.tetoPracaMin === null && dados.tetoPracaMax === null ? (
              <ItemPremissa rotulo="Preço da praça" valor="Não informado" />
            ) : (
              <>
                {dados.tetoPracaMin !== null && (
                  <ItemPremissa
                    rotulo="Preço mínimo da praça"
                    valor={`R$ ${formatarReais(dados.tetoPracaMin)}`}
                  />
                )}
                {dados.tetoPracaMax !== null && (
                  <ItemPremissa
                    rotulo="Preço máximo da praça"
                    valor={`R$ ${formatarReais(dados.tetoPracaMax)}`}
                  />
                )}
              </>
            )}
          </GrupoPremissas>
        </div>
      )}
    </section>
  );
}

function GrupoPremissas({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{titulo}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function ItemPremissa({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className={ROTULO_VALOR}>{rotulo}</p>
      <p className={TEXTO_VALOR}>{valor}</p>
    </div>
  );
}
