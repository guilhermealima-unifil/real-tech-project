import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  tokensMatch,
  verifyPassword,
} from "./crypto";

describe("hashPassword / verifyPassword", () => {
  it("uma senha correta verifica como válida", async () => {
    const hash = await hashPassword("senha-correta-123");
    await expect(verifyPassword("senha-correta-123", hash)).resolves.toBe(true);
  });

  it("uma senha errada verifica como inválida", async () => {
    const hash = await hashPassword("senha-correta-123");
    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });

  it("duas senhas iguais produzem hashes diferentes (salt aleatório)", async () => {
    const hashA = await hashPassword("mesma-senha");
    const hashB = await hashPassword("mesma-senha");
    expect(hashA).not.toBe(hashB);
  });

  it("o hash é Argon2id", async () => {
    const hash = await hashPassword("senha-qualquer");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("hash malformado/de outro algoritmo verifica como inválido, sem lançar exceção", async () => {
    await expect(verifyPassword("qualquer-coisa", "não-é-um-hash-argon2")).resolves.toBe(false);
  });
});

describe("generateSessionToken / hashSessionToken", () => {
  it("gera um token com entropia de 256 bits (32 bytes em base64url)", () => {
    const token = generateSessionToken();
    // base64url de 32 bytes não tem padding: ceil(32*8/6) = 43 caracteres.
    expect(token.length).toBe(43);
  });

  it("duas chamadas geram tokens diferentes", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
  });

  it("o mesmo token sempre produz o mesmo hash", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("tokens diferentes não colidem no hash", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(hashSessionToken(a)).not.toBe(hashSessionToken(b));
  });

  it("o hash é um digest SHA-256 (64 caracteres hex)", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("tokensMatch", () => {
  it("hashes iguais são considerados iguais", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(tokensMatch(hash, hashSessionToken(token))).toBe(true);
  });

  it("hashes diferentes são considerados diferentes", () => {
    const hashA = hashSessionToken(generateSessionToken());
    const hashB = hashSessionToken(generateSessionToken());
    expect(tokensMatch(hashA, hashB)).toBe(false);
  });

  it("strings de tamanhos diferentes são consideradas diferentes, sem lançar exceção", () => {
    expect(tokensMatch("curto", "muito-mais-comprido-que-o-outro")).toBe(false);
  });
});
