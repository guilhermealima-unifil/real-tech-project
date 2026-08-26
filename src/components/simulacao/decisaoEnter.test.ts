import { describe, expect, it } from "vitest";
import { decidirAcaoEnter } from "./decisaoEnter";

describe("decidirAcaoEnter — regressão: Enter não pode pular a Etapa Mercado", () => {
  it("em Operação/Margens (não é a última etapa), Enter num campo deve avançar, nunca submeter", () => {
    expect(decidirAcaoEnter({ eUltimaEtapa: false, tagNameAlvo: "INPUT" })).toBe("avancar");
    expect(decidirAcaoEnter({ eUltimaEtapa: false, tagNameAlvo: "SELECT" })).toBe("avancar");
  });

  it("em Mercado (última etapa), Enter num campo deve deixar a submissão nativa acontecer (= Simular)", () => {
    expect(decidirAcaoEnter({ eUltimaEtapa: true, tagNameAlvo: "INPUT" })).toBe("submeter-nativo");
  });

  it("nunca interfere quando o foco está num botão (Voltar/Nova simulação/casos reais tratam Enter sozinhos)", () => {
    expect(decidirAcaoEnter({ eUltimaEtapa: false, tagNameAlvo: "BUTTON" })).toBe("ignorar");
    expect(decidirAcaoEnter({ eUltimaEtapa: true, tagNameAlvo: "BUTTON" })).toBe("ignorar");
  });
});
