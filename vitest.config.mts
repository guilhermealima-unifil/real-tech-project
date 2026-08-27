import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Sem este arquivo, nenhum teste consegue importar um módulo que use o
 * alias "@/*" (ex.: src/lib/prisma.ts importa "@/generated/prisma/client",
 * e agora src/lib/auth/session.ts importa "@/lib/prisma") — o Vitest não lê
 * o "paths" do tsconfig.json sozinho, só o Next.js faz isso no build/dev.
 * Bloqueio descoberto ao escrever session.test.ts; nenhum teste anterior
 * havia importado algo com esse alias.
 *
 * O `import "dotenv/config"` no topo segue o mesmo padrão já usado em
 * prisma7.config.ts e prisma/seed.ts — sem ele, DATABASE_URL não chega ao
 * processo do Vitest.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Argon2id (src/lib/auth/crypto.ts) é deliberadamente lento/pesado em
    // memória — é o ponto do algoritmo. Um teste que hasheia senha mais de
    // uma vez (ex.: "register com e-mail duplicado", que registra duas
    // vezes) passa perto do timeout padrão de 5s do Vitest sob contenção de
    // CPU (visto ao vivo: passou em ~1.2s isolado, mas estourou 5s rodando
    // junto com outros processos). 15s dá folga sem mascarar um hang real.
    testTimeout: 15000,
  },
});
