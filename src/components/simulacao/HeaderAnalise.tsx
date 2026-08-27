"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { anoAnterior, anoProximo } from "./navegacaoAno";

export type SecaoAnalise = "faixa" | "negociacao" | "caixa" | "comparar";

export interface SecaoAnaliseOpcao {
  valor: SecaoAnalise;
  rotulo: string;
}

/** Divisor vertical discreto entre grupos — só desktop, onde os grupos dividem a mesma linha. */
const DIVISOR = "hidden self-stretch border-l border-border sm:block";

/** Rótulo pequeno acima de um controle — só desktop (ver ConteudoAcaoResponsivo/PARTE 1 mobile: sem legendas soltas, o valor selecionado já fala por si num Select). */
const LEGENDA_GRUPO = "hidden text-[11px] font-medium uppercase tracking-wide text-muted sm:block";

interface HeaderAnaliseProps {
  anos: number[];
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
  secoes: SecaoAnaliseOpcao[];
  secaoAtual: SecaoAnalise;
  onSelecionarSecao: (secao: SecaoAnalise) => void;
  /** Ações da simulação inteira (Salvar simulação/Editar dados/Nova simulação) — omitido no histórico, ver DetalheSimulacaoSalva.tsx. */
  acoes?: ReactNode;
}

/**
 * Barra de contexto/decisão do Resultado — sticky, no topo da análise,
 * pensada como TOOLBAR compacta, não um painel completo.
 *
 * Só o ANO é controle global aqui — a estratégia de repasse (Integral/
 * Gradual/Absorção) saiu do header, ver SeletorEstrategiaRepasse.tsx,
 * agora dentro da aba "Faixa viável": das seções da análise, só ela reage
 * de verdade à estratégia; um header global prometeria uma relação causal
 * que o produto não tem (ver ComparacaoCenarios.tsx, AnaliseDesconto,
 * ImpactoCaixaChart — nenhum recebe essa prop).
 *
 * Desktop: ano (‹Select›) e ações (rótulo curto — "Salvar"/"Editar"/"Nova",
 * ver ConteudoAcaoResponsivo) na MESMA linha sempre, com divisor vertical.
 * `sm:flex-nowrap` na linha garante isso — sem ele, a `flex-wrap` que o
 * mobile precisa (ver abaixo) deixava as ações caírem para uma segunda
 * linha sempre que a soma das larguras não coubesse.
 *
 * Mobile: ano vira `Select` (primitive existente, mesmo
 * `anoSelecionado`/`onSelecionarAno`, sem estado paralelo); anterior/
 * próximo do ano somem visualmente (o Select já cobre 2026-2033); as ações
 * viram ícone (ver `ConteudoAcaoResponsivo`, usado por quem monta
 * `acoes` — SalvarSimulacao.tsx/ResultadoSimulacao.tsx); ano + ações
 * cabem numa linha só, com `flex-wrap` como rede de segurança (só
 * ativa abaixo do breakpoint `sm`, já que a linha vira `sm:flex-nowrap`).
 *
 * Sem nenhuma recomendação/leitura de status aqui — o header é só
 * contexto/ações globais (ano + Salvar/Editar/Nova + abas). A leitura do
 * status do preço (antes uma linha "Ação recomendada" fixa aqui) agora
 * mora dentro da aba "Faixa viável", que é a única seção que realmente
 * depende da estratégia selecionada (ver LeituraFaixa.tsx e
 * NavegacaoAnalise.tsx) — o header nunca soube o suficiente para recomendar
 * nada com essa frase fixa, e prometia uma leitura que não tinha.
 *
 * Ano NÃO duplica markup por breakpoint como um componente à parte: é o
 * mesmo bloco o tempo todo, só que tem uma variante `sm:hidden` (Select) e
 * uma `hidden sm:flex` (botões ‹›) apontando pro MESMO estado controlado —
 * ambas sempre montadas, só uma visível por vez (`display:none` tira a
 * outra do layout, do foco e da árvore de acessibilidade). `acoes`, ao
 * contrário, PODE guardar estado (ex.: SalvarSimulacao tem seu próprio
 * diálogo) — por isso ele é renderizado uma ÚNICA vez neste componente,
 * nunca duplicado por breakpoint; quem decide ícone vs. texto é o próprio
 * botão, por dentro (mesma técnica de span responsivo).
 *
 * Componente de domínio (não um primitive genérico de header): sabe o que
 * são ano analisado e as seções da análise. Continua usando só primitives
 * (Button, Select) para os controles interativos.
 *
 * `role="tablist"`/`"tab"` para as seções — os `tabpanel`s continuam
 * sendo renderizados por quem chama, este componente não é dono do
 * conteúdo das seções, só da navegação.
 */
export function HeaderAnalise({
  anos,
  anoSelecionado,
  onSelecionarAno,
  secoes,
  secaoAtual,
  onSelecionarSecao,
  acoes,
}: HeaderAnaliseProps) {
  const tabsSecaoRef = useRef<(HTMLButtonElement | null)[]>([]);

  const anoAnteriorValor = anoAnterior(anos, anoSelecionado);
  const anoProximoValor = anoProximo(anos, anoSelecionado);

  function onSecaoKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + secoes.length) % secoes.length;
    onSelecionarSecao(secoes[proximoIndice].valor);
    tabsSecaoRef.current[proximoIndice]?.focus();
  }

  return (
    <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background px-6 pt-2.5 sm:mx-0 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-x-4">
        {/* Ano — Select sempre; anterior/próximo somem visualmente no mobile (PARTE 3). */}
        <div className="flex shrink-0 flex-col gap-1">
          <span className={LEGENDA_GRUPO}>Ano</span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Ano anterior"
              title="Ano anterior"
              disabled={anoAnteriorValor === null}
              onClick={() => anoAnteriorValor !== null && onSelecionarAno(anoAnteriorValor)}
              className="hidden px-2.5 sm:inline-flex"
            >
              <span aria-hidden="true">‹</span>
            </Button>

            <Select
              aria-label="Ano analisado"
              value={String(anoSelecionado)}
              onChange={(e) => onSelecionarAno(Number(e.target.value))}
              options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))}
              className="font-figures w-20 sm:w-24"
            />

            <Button
              variant="ghost"
              size="sm"
              aria-label="Próximo ano"
              title="Próximo ano"
              disabled={anoProximoValor === null}
              onClick={() => anoProximoValor !== null && onSelecionarAno(anoProximoValor)}
              className="hidden px-2.5 sm:inline-flex"
            >
              <span aria-hidden="true">›</span>
            </Button>
          </div>
        </div>

        <div className={DIVISOR} aria-hidden="true" />

        {acoes && <div className="flex shrink-0 items-center gap-1.5">{acoes}</div>}
      </div>

      <div
        role="tablist"
        aria-label="Seção de análise"
        className="mt-2.5 flex gap-x-5 overflow-x-auto sm:gap-x-7"
      >
        {secoes.map((secao, indice) => (
          <button
            key={secao.valor}
            ref={(el) => {
              tabsSecaoRef.current[indice] = el;
            }}
            id={`tab-secao-${secao.valor}`}
            type="button"
            role="tab"
            aria-selected={secaoAtual === secao.valor}
            aria-controls={`painel-secao-${secao.valor}`}
            tabIndex={secaoAtual === secao.valor ? 0 : -1}
            onClick={() => onSelecionarSecao(secao.valor)}
            onKeyDown={(e) => onSecaoKeyDown(e, indice)}
            className={
              "shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm transition-colors " +
              (secaoAtual === secao.valor
                ? "border-primary font-semibold text-primary"
                : "border-transparent font-medium text-text-secondary hover:text-text-primary")
            }
          >
            {secao.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Conteúdo responsivo de uma ação global (Salvar/Editar/Nova, ver
 * ResultadoSimulacao.tsx e SalvarSimulacao.tsx): ícone no mobile, rótulo
 * CURTO no desktop ("Salvar", não "Salvar simulação" — cabe na mesma linha
 * do ano, ver a toolbar em HeaderAnalise). `aria-label`/`title`
 * ficam sempre no `Button` de quem chama, com o rótulo completo — isto
 * aqui só troca o conteúdo VISÍVEL; o ícone já é `aria-hidden` (ver
 * icones.tsx) e o `<span>` que o envolve reforça isso, então leitor de tela
 * nunca lê o ícone nem um rótulo diferente do `aria-label`.
 */
export function ConteudoAcaoResponsivo({
  rotulo,
  icone,
}: {
  rotulo: string;
  icone: ReactNode;
}) {
  return (
    <>
      <span aria-hidden="true" className="sm:hidden">
        {icone}
      </span>
      <span className="hidden sm:inline">{rotulo}</span>
    </>
  );
}
