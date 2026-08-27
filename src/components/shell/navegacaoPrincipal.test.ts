import { describe, expect, it } from "vitest";
import { hrefEfetivo, itemNavegacaoAtivo, ITENS_NAVEGACAO_PRINCIPAL } from "./navegacaoPrincipal";

describe("itemNavegacaoAtivo", () => {
  it("ativa em correspondência exata", () => {
    expect(itemNavegacaoAtivo("/historico", "/historico")).toBe(true);
    expect(itemNavegacaoAtivo("/simulador", "/simulador")).toBe(true);
  });

  it("ativa em sub-rota (ex.: detalhe do histórico)", () => {
    expect(itemNavegacaoAtivo("/historico/abc123", "/historico")).toBe(true);
  });

  it("não ativa para uma rota que só compartilha o prefixo textual", () => {
    // "/historico-antigo" não é uma sub-rota de "/historico" — só começa
    // com os mesmos caracteres. A checagem `startsWith(href + "/")` existe
    // exatamente para não confundir esses dois casos.
    expect(itemNavegacaoAtivo("/historico-antigo", "/historico")).toBe(false);
  });

  it("não ativa para rota totalmente diferente", () => {
    expect(itemNavegacaoAtivo("/login", "/historico")).toBe(false);
  });

  it("'/' só ativa em correspondência exata, nunca por prefixo", () => {
    expect(itemNavegacaoAtivo("/", "/")).toBe(true);
    expect(itemNavegacaoAtivo("/simulador", "/")).toBe(false);
  });
});

describe("hrefEfetivo", () => {
  const itemPublico = ITENS_NAVEGACAO_PRINCIPAL.find((i) => !i.requerAutenticacao)!;
  const itemProtegido = ITENS_NAVEGACAO_PRINCIPAL.find((i) => i.requerAutenticacao)!;

  it("item sem exigência de autenticação sempre usa o próprio href", () => {
    expect(hrefEfetivo(itemPublico, true)).toBe(itemPublico.href);
    expect(hrefEfetivo(itemPublico, false)).toBe(itemPublico.href);
  });

  it("item protegido usa o próprio href quando autenticado", () => {
    expect(hrefEfetivo(itemProtegido, true)).toBe(itemProtegido.href);
  });

  it("item protegido aponta para /login quando deslogado — nunca um link morto", () => {
    expect(hrefEfetivo(itemProtegido, false)).toBe("/login");
  });
});
