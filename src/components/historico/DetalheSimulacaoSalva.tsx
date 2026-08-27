"use client";

/**
 * Apresentação read-only de uma simulação salva (/historico/[id]) — reusa
 * a mesma navegação de análise da simulação ao vivo (NavegacaoAnalise,
 * ver src/components/simulacao/ResultadoSimulacao.tsx), controlada aqui
 * por `useState` local em vez do estado global do simulador
 * (`useSimulation()`): este componente não está — e não deveria ficar —
 * acoplado ao reducer ao vivo, só ao snapshot que já veio pronto do banco.
 *
 * Nenhum recálculo: `simulacao.cenarios`/`impactoCaixa` já vêm prontos do
 * snapshot gravado — este componente só decide qual ano/cenário/seção
 * mostrar.
 *
 * Mesma estrutura da tela ao vivo (ver ResultadoSimulacao.tsx): a ação
 * recomendada e o preço recomendado moram dentro de `NavegacaoAnalise`
 * (header sticky + painel "Faixa viável"); aqui só sem a prop `acoes` —
 * Salvar/Editar/Nova simulação pertencem só à simulação ativa, nunca ao
 * histórico. `PremissasSimulacao` (via `NavegacaoAnalise`) também é só
 * leitura aqui pelo mesmo motivo — ela nunca teve nenhum atalho de edição
 * (ver PremissasSimulacao.tsx), então reusar não exige nenhuma prop extra
 * para desligar nada; os dados vêm direto dos campos já achatados de
 * `SimulacaoDetalhe` (snapshot gravado, nunca recalculado).
 *
 * Ramo e data de salvamento já aparecem no <header> de
 * src/app/historico/[id]/page.tsx — não repetidos aqui.
 */

import { useState } from "react";
import type { CenarioRepasse } from "@/lib/motor";
import type { SimulacaoDetalhe } from "@/lib/historico";
import { NavegacaoAnalise } from "@/components/simulacao/NavegacaoAnalise";
import type { PremissasDados } from "@/components/simulacao/premissas";

interface DetalheSimulacaoSalvaProps {
  simulacao: SimulacaoDetalhe;
}

export function DetalheSimulacaoSalva({ simulacao }: DetalheSimulacaoSalvaProps) {
  const [cenarioSelecionado, setCenarioSelecionado] = useState<CenarioRepasse>("integral");
  const resultadosDoCenario = simulacao.cenarios[cenarioSelecionado];
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    resultadosDoCenario[0]?.ano ?? new Date().getFullYear(),
  );
  const [descontoPedidoPct, setDescontoPedidoPct] = useState(0);

  const cenarioIrrelevante = simulacao.formulaTipo === "markup";

  const premissas: PremissasDados = {
    custoCompra: simulacao.custoCompra,
    ramoRotulo: simulacao.ramoRotulo,
    formulaTipo: simulacao.formulaTipo,
    despesaFixaPct: simulacao.despesaFixaPct,
    markupPct: simulacao.markupPct,
    margemAlvoPct: simulacao.margemAlvoPct,
    margemMinimaPct: simulacao.margemMinimaPct,
    tetoPracaMin: simulacao.tetoPracaMin,
    tetoPracaMax: simulacao.tetoPracaMax,
    prazoPagamentoFornecedorDias: simulacao.prazoPagamentoFornecedorDias,
  };

  return (
    <div className="flex flex-col gap-8">
      <NavegacaoAnalise
        cenarioSelecionado={cenarioSelecionado}
        onSelecionarCenario={setCenarioSelecionado}
        cenarioIrrelevante={cenarioIrrelevante}
        resultados={resultadosDoCenario}
        cenarios={simulacao.cenarios}
        anoSelecionado={anoSelecionado}
        onSelecionarAno={setAnoSelecionado}
        custoCompra={simulacao.custoCompra}
        descontoPedidoPct={descontoPedidoPct}
        onDescontoPedidoChange={setDescontoPedidoPct}
        impactoCaixa={simulacao.impactoCaixa}
        premissas={premissas}
      />
    </div>
  );
}
