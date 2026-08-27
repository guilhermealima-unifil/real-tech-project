import { describe, expect, it } from "vitest";
import { paraUsuarioPublico } from "./usuario";
import type { User } from "@/generated/prisma/client";

describe("paraUsuarioPublico", () => {
  it("expõe apenas id, nome, email e createdAt — nunca passwordHash", () => {
    const user: User = {
      id: "user-1",
      nome: "Fulano",
      email: "fulano@exemplo.com",
      passwordHash: "$argon2id$segredo-que-nunca-deve-vazar",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    };

    const publico = paraUsuarioPublico(user);

    expect(publico).toEqual({
      id: "user-1",
      nome: "Fulano",
      email: "fulano@exemplo.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(JSON.stringify(publico)).not.toContain("passwordHash");
    expect(JSON.stringify(publico)).not.toContain("segredo-que-nunca-deve-vazar");
  });
});
