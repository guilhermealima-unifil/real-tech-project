import { describe, expect, it } from "vitest";
import { normalizarEmail, validarEntradaLogin, validarEntradaRegistro } from "./validacao";

describe("normalizarEmail", () => {
  it("remove espaços nas pontas e converte para minúsculas", () => {
    expect(normalizarEmail("  Fulano@Exemplo.COM  ")).toBe("fulano@exemplo.com");
  });
});

describe("validarEntradaRegistro", () => {
  const valido = { nome: "Fulano", email: "fulano@exemplo.com", password: "senha-valida-123" };

  it("aceita uma entrada válida e normaliza o e-mail", () => {
    const resultado = validarEntradaRegistro({ ...valido, email: "  Fulano@Exemplo.COM  " });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.entrada.email).toBe("fulano@exemplo.com");
  });

  it("rejeita corpo que não é um objeto", () => {
    expect(validarEntradaRegistro("não é objeto").ok).toBe(false);
    expect(validarEntradaRegistro(null).ok).toBe(false);
  });

  it("rejeita nome ausente ou muito curto", () => {
    expect(validarEntradaRegistro({ ...valido, nome: "" }).ok).toBe(false);
    expect(validarEntradaRegistro({ ...valido, nome: "A" }).ok).toBe(false);
  });

  it("rejeita e-mail em formato inválido", () => {
    expect(validarEntradaRegistro({ ...valido, email: "não-é-email" }).ok).toBe(false);
  });

  it("rejeita senha fora do intervalo mínimo/máximo", () => {
    expect(validarEntradaRegistro({ ...valido, password: "curta" }).ok).toBe(false);
    expect(validarEntradaRegistro({ ...valido, password: "x".repeat(201) }).ok).toBe(false);
  });

  it("aceita senha exatamente no limite mínimo (8 caracteres)", () => {
    expect(validarEntradaRegistro({ ...valido, password: "12345678" }).ok).toBe(true);
  });
});

describe("validarEntradaLogin", () => {
  it("aceita e-mail e senha presentes, normalizando o e-mail", () => {
    const resultado = validarEntradaLogin({ email: "  Fulano@Exemplo.COM  ", password: "qualquer-coisa" });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.entrada.email).toBe("fulano@exemplo.com");
  });

  it("rejeita e-mail ou senha ausentes", () => {
    expect(validarEntradaLogin({ email: "fulano@exemplo.com" }).ok).toBe(false);
    expect(validarEntradaLogin({ password: "qualquer-coisa" }).ok).toBe(false);
    expect(validarEntradaLogin({}).ok).toBe(false);
  });
});
