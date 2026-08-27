"use client";

import { useEffect, useRef, useState } from "react";
import { formatarReais } from "@/lib/frases";
import { validarNomeProdutoSimulacao } from "@/lib/simulacoesCliente";

interface DialogSalvarSimulacaoProps {
  ramoRotulo: string | null;
  precoAnalisado: number | null;
  salvando: boolean;
  erro: string | null;
  onCancelar: () => void;
  onConfirmar: (nomeProduto: string) => void;
}

const CAMPO_TEXTO =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary";

/**
 * Dialog "Salvar simulação" — pedido explicitamente pequeno e independente
 * de PainelEdicaoRapida.tsx (mesmo padrão de acessibilidade — role="dialog",
 * Escape, backdrop, foco tratado —, sem importar nada de lá: são
 * propósitos diferentes, um acoplamento por conveniência aqui só criaria
 * uma dependência artificial entre "editar dados" e "salvar").
 *
 * Controlado inteiramente por props: quem decide SE está salvando, qual
 * erro mostrar e o que fazer com o nome confirmado é SalvarSimulacao.tsx
 * (que já tinha essa máquina de estados antes desta etapa). Este
 * componente só cuida de coletar e validar localmente o nome antes de
 * repassar para `onConfirmar` — nunca chama fetch, nunca sabe o que é
 * `SimulationResult`.
 */
export function DialogSalvarSimulacao({
  ramoRotulo,
  precoAnalisado,
  salvando,
  erro,
  onCancelar,
  onConfirmar,
}: DialogSalvarSimulacaoProps) {
  const [nome, setNome] = useState("");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Foco inicial no input — é o único campo do dialog, faz sentido o
  // usuário já poder digitar assim que ele abre.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  function aoSalvar() {
    const erroDeValidacao = validarNomeProdutoSimulacao(nome);
    if (erroDeValidacao) {
      setErroValidacao(erroDeValidacao);
      return;
    }
    setErroValidacao(null);
    onConfirmar(nome);
  }

  // Erro local (validação, checada antes de qualquer request) tem
  // prioridade sobre o erro vindo do backend — se o usuário está com um
  // nome inválido agora, é isso que ele precisa corrigir primeiro, mesmo
  // que uma tentativa anterior tenha falhado por outro motivo.
  const erroExibido = erroValidacao ?? erro;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text-primary/40" aria-hidden="true" onClick={onCancelar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-salvar-simulacao"
        className="shadow-elevated relative w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-6"
      >
        <h2 id="titulo-salvar-simulacao" className="text-base font-semibold text-text-primary">
          Salvar simulação
        </h2>

        <label className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text-primary">Nome do produto ou serviço</span>
          <input
            ref={inputRef}
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (erroValidacao) setErroValidacao(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                aoSalvar();
              }
            }}
            placeholder="Ex.: Geladeira Electrolux 480L"
            maxLength={200}
            disabled={salvando}
            className={CAMPO_TEXTO}
          />
        </label>

        {(ramoRotulo || precoAnalisado !== null) && (
          <div className="mt-3 text-xs text-text-secondary">
            {ramoRotulo && <p>{ramoRotulo}</p>}
            {precoAnalisado !== null && (
              <p className="font-figures mt-0.5">
                Preço analisado: R$ {formatarReais(precoAnalisado)}
              </p>
            )}
          </div>
        )}

        {erroExibido && <p className="mt-3 text-xs text-danger">{erroExibido}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoSalvar}
            disabled={salvando}
            className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
