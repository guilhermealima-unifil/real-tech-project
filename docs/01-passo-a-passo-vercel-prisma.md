# Real Tech — Passo a Passo: Backend, Banco de Dados e Prisma na Vercel

**Solveathon SESCAP 2026 · Sprint Day: 27/08/2026**

Este guia parte de uma mudança de arquitetura em relação ao Plano de Implementação original. O plano previa "sem backend, sem banco, sem login" — todo o cálculo rodando no navegador, justamente para não depender de infraestrutura em 8 dias e não depender do wi-fi do local no palco. Vocês decidiram seguir por outro caminho: **Vercel + API routes (backend) + Prisma ORM + PostgreSQL**. Isso é uma decisão válida e mostra profundidade técnica ao júri, mas troca uma garantia (o app funciona sem rede) por outra (dados versionados, histórico, multi-CNPJ). O Documento 2 detalha essa troca; aqui o foco é só o "como fazer".

Este documento não explica como conectar o repositório Git à Vercel — assume-se que esse passo já está feito e que existe um projeto Next.js (App Router) na raiz do repositório.

---

## 0. Visão geral da arquitetura

```
Navegador (React/Next.js)
        │  fetch/POST
        ▼
API Routes da Vercel (Serverless Functions em /app/api/*)
        │  Prisma Client
        ▼
PostgreSQL (Prisma Postgres via Vercel Marketplace)
```

O motor de cálculo (`simular()`, a função central descrita no Plano de Implementação) deve ser escrito como uma função pura em TypeScript, sem nenhuma dependência de banco ou de rede. Ela mora em `lib/motor.ts` e é chamada de dentro das API routes. Isso mantém a Fase 1 do plano original intacta (motor testável isoladamente) mesmo com o backend novo — só muda **onde** ela roda.

---

## 1. Pré-requisitos

- Conta na Vercel com o projeto já criado (Hobby é suficiente para o Sprint Day).
- Projeto Next.js 15+ com App Router já inicializado localmente (`app/`, `package.json`).
- Node.js 18+ instalado localmente.
- Vercel CLI instalada globalmente:

```bash
npm install -g vercel@latest
```

---

## 2. Criar o banco de dados PostgreSQL na Vercel

A Vercel não hospeda mais o Postgres diretamente — hoje o banco é provisionado via **Vercel Marketplace**, que integra provedores como Prisma Postgres, Neon e Supabase direto no dashboard do projeto. Para este projeto, o caminho recomendado é o **Prisma Postgres**, porque a integração já entrega a `DATABASE_URL` pronta para uso com o Prisma ORM, sem passos extras de configuração de pooling.

Passo a passo no dashboard da Vercel:

1. Abra o projeto na Vercel e vá na aba **Storage**.
2. Clique em **Create Database** (ou **Connect Database**).
3. Escolha **Prisma Postgres** na lista do Marketplace.
4. Selecione a região mais próxima (ex.: `gru1` — São Paulo, se disponível, ou a região onde o projeto já faz deploy).
5. Escolha o plano gratuito/hobby.
6. Dê um nome ao banco (ex.: `realtech-db`) e confirme a criação.

Ao concluir, a Vercel injeta automaticamente a variável de ambiente `DATABASE_URL` no projeto (Production, Preview e Development), já apontando para o banco recém-criado. Não é preciso copiar string de conexão manualmente.

> Alternativa: se preferirem Neon ou Supabase diretamente (ex.: por já terem uma conta), o fluxo é o mesmo — aba Storage → Marketplace → escolher o provedor. O restante deste guia funciona igual, pois o Prisma só precisa de uma `DATABASE_URL` válida.

---

## 3. Trazer as variáveis de ambiente para a máquina local

Com o banco criado na Vercel, sincronize as variáveis para desenvolvimento local:

```bash
vercel link          # associa a pasta local ao projeto Vercel (se ainda não estiver linkado)
vercel env pull .env
```

Isso cria um arquivo `.env` na raiz do projeto com `DATABASE_URL` (e, dependendo do provedor, `DIRECT_URL` para uso em migrations). Confirme que `.env` está no `.gitignore` — nunca commitar credenciais de banco.

---

## 4. Instalar o Prisma e dependências

```bash
npm install prisma tsx --save-dev
npm install @prisma/client @prisma/adapter-pg pg dotenv
```

- `prisma`: CLI usada em desenvolvimento (migrations, generate).
- `@prisma/client`: cliente gerado, usado em runtime.
- `@prisma/adapter-pg` + `pg`: driver adapter recomendado para Postgres em ambientes serverless (evita esgotar conexões na Vercel).

---

## 5. Inicializar o Prisma

```bash
npx prisma init --output ../app/generated/prisma
```

Isso cria:

- `prisma/schema.prisma` — onde o schema do banco é definido.
- `prisma.config.ts` — configuração do Prisma (schema path e datasource).
- Confirma a existência do `.env` com `DATABASE_URL`.

Ajuste `prisma.config.ts` para usar a variável já injetada pela Vercel:

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

---

## 6. Definir o schema do banco (`prisma/schema.prisma`)

Abaixo o schema mínimo para o MVP, alinhado ao motor de cálculo e às tabelas detalhadas no Documento 2 (seção "Banco de dados"). Cole isso substituindo o conteúdo gerado por padrão:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Ramo {
  id               String   @id @default(cuid())
  chave            String   @unique   // "eletro" | "eletrico" | "vestuario"
  rotulo           String              // "Eletrodomésticos e móveis"
  aliquotaSugerida Decimal  @db.Decimal(5, 2)
  tratamento       String              // "padrao" | "misto"
  entraNoMvp       Boolean  @default(true)
  simulacoes       Simulacao[]
}

model ParametroTributario {
  id             String  @id @default(cuid())
  versao         String              // "2026-08"
  vigencia       DateTime
  fonte          String              // "LC 214/2025 e parâmetros do Comitê Gestor do IBS"
  ano            Int     @unique      // 2026..2033
  cbsPct         Decimal @db.Decimal(6, 4)
  ibsPct         Decimal @db.Decimal(6, 4)
  pisCofinsPct   Decimal @db.Decimal(6, 4)
  icmsIssPct     Decimal @db.Decimal(6, 4)
}

model Empresa {
  id         String       @id @default(cuid())
  nome       String
  cnpj       String?      @unique
  ramoId     String?
  regime     String              // "simples" | "lucroReal"
  createdAt  DateTime     @default(now())
  simulacoes Simulacao[]
}

model Simulacao {
  id                 String   @id @default(cuid())
  empresaId          String?
  empresa            Empresa? @relation(fields: [empresaId], references: [id])
  ramoId             String
  ramo               Ramo     @relation(fields: [ramoId], references: [id])
  rotulo             String              // "Caso EletroLondrina"
  formulaTipo        String              // "multiplicador" | "markup"
  custoCompra        Decimal  @db.Decimal(12, 2)
  despesaFixaPct     Decimal? @db.Decimal(6, 4)
  markupPct          Decimal? @db.Decimal(6, 4)
  margemAlvoPct      Decimal  @db.Decimal(6, 4)
  margemMinimaPct    Decimal  @db.Decimal(6, 4)
  aliquotaCustomizada Decimal? @db.Decimal(6, 4)
  tetoPracaMin       Decimal? @db.Decimal(12, 2)
  tetoPracaMax       Decimal? @db.Decimal(12, 2)
  cenarioRepasse     String   @default("integral") // "integral" | "gradual" | "absorcao"
  anosGradual        Int?     @default(3)
  createdAt          DateTime @default(now())
  resultados         ResultadoAnual[]
}

model ResultadoAnual {
  id                  String    @id @default(cuid())
  simulacaoId         String
  simulacao           Simulacao @relation(fields: [simulacaoId], references: [id], onDelete: Cascade)
  ano                 Int
  preco               Decimal   @db.Decimal(12, 2)
  margemResultante    Decimal   @db.Decimal(6, 4)
  tributoTotalPct     Decimal   @db.Decimal(6, 4)
  piso                Decimal   @db.Decimal(12, 2)
  teto                Decimal?  @db.Decimal(12, 2)
  descontoMaximoPct   Decimal?  @db.Decimal(6, 4)
  alertaDisparado     Boolean   @default(false)
  mensagemRecomendacao String?

  @@unique([simulacaoId, ano])
}
```

Pontos de atenção:

- Todos os percentuais usam `Decimal`, nunca `Float` — arredondamento errado em ponto flutuante é inaceitável em um produto que existe justamente para calcular margem com precisão.
- `ResultadoAnual` é uma tabela derivada: pode ser recalculada a qualquer momento a partir de `Simulacao` + `ParametroTributario`. Persistir os resultados é opcional para o MVP (dá para calcular on-the-fly a cada request), mas ajuda a mostrar "histórico de decisões" na demonstração, se sobrar tempo.

---

## 7. Aplicar o schema no banco

Para o ritmo do Sprint Day, use `db push` (mais rápido, não gera arquivos de migration) durante o desenvolvimento ativo, e passe para `migrate dev` quando o schema estabilizar:

```bash
# durante a fase de exploração (rápido, sem gerar histórico de migration)
npx prisma db push

# quando o schema estiver estável (gera migration versionada)
npx prisma migrate dev --name init
```

Depois, gere o client:

```bash
npx prisma generate
```

Adicione ao `package.json` para o client ser gerado automaticamente em cada `npm install` (incluindo o build da Vercel):

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

E adicione ao `.gitignore`:

```
app/generated/prisma/
```

---

## 8. Criar o Prisma Client singleton

Crie `lib/prisma.ts`:

```typescript
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

O padrão singleton evita abrir uma conexão nova a cada hot-reload em desenvolvimento e por invocação de função serverless em produção.

---

## 9. Estrutura de pastas do backend

```
app/
  api/
    ramos/route.ts                 GET  — lista os ramos e alíquotas sugeridas
    parametros/route.ts            GET  — lista os parâmetros tributários 2026-2033
    simular/route.ts               POST — roda o motor e retorna a faixa viável (sem salvar)
    simulacoes/route.ts            GET, POST — lista / cria e salva uma simulação
    simulacoes/[id]/route.ts       GET, DELETE — detalhe e remoção de uma simulação
    empresas/route.ts              GET, POST — (opcional) cadastro simples de empresa
lib/
  prisma.ts                        singleton do Prisma Client
  motor.ts                         função pura simular(entrada, parametros)
  frases.ts                        frases fixas de recomendação (Fase 1 do plano original)
prisma/
  schema.prisma
```

O motor (`lib/motor.ts`) deve ser **portado exatamente** da especificação da seção 3 do Plano de Implementação (as duas fórmulas, os três cenários, o cálculo de desconto). Ele não importa nada de `lib/prisma.ts` — recebe os parâmetros tributários já carregados como argumento. Isso permite testar o motor com Vitest sem precisar de banco.

---

## 10. Implementar o endpoint principal (`POST /api/simular`)

```typescript
// app/api/simular/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { simular } from "@/lib/motor";

export async function POST(request: Request) {
  const entrada = await request.json();

  const parametros = await prisma.parametroTributario.findMany({
    orderBy: { ano: "asc" },
  });

  if (parametros.length === 0) {
    return NextResponse.json(
      { erro: "Parâmetros tributários não carregados. Rode o seed." },
      { status: 500 }
    );
  }

  const resultado = simular(entrada, parametros);
  return NextResponse.json(resultado);
}
```

O corpo esperado da requisição (`entrada`) segue exatamente a tabela de campos da seção 3.2 do Plano de Implementação (`custoCompra`, `despesaFixaPct` ou `markupPct`, `margemAlvoPct`, `margemMinimaPct`, `regime`, `ramo`, `aliquota`, `tetoPraca`).

---

## 11. Popular o banco com os dados semeados (seed)

Crie `prisma/seed.ts` com os três ramos do MVP, os parâmetros tributários de 2026 a 2033 (a confirmar com o contador antes de congelar) e os dois casos reais (EletroLondrina e In-Pacto) como simulações pré-carregadas — o plano original é explícito: **"a aplicação abre com os casos reais da EletroLondrina e do In-Pacto pré-carregados"**, e isso continua valendo com banco de dados.

```typescript
// prisma/seed.ts
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.ramo.createMany({
    data: [
      { chave: "eletro", rotulo: "Eletrodomésticos e móveis", aliquotaSugerida: 26.5, tratamento: "padrao" },
      { chave: "eletrico", rotulo: "Material elétrico e construção", aliquotaSugerida: 26.5, tratamento: "padrao" },
      { chave: "vestuario", rotulo: "Vestuário e calçados", aliquotaSugerida: 26.5, tratamento: "padrao" },
    ],
    skipDuplicates: true,
  });

  // Alíquotas ilustrativas — validar com o contador (Jonathas Oliveira) antes do Sprint Day.
  await prisma.parametroTributario.createMany({
    data: [
      { versao: "2026-08", vigencia: new Date("2026-08-20"), fonte: "LC 214/2025", ano: 2026, cbsPct: 0.9, ibsPct: 0.1, pisCofinsPct: 3.65, icmsIssPct: 18 },
      // ... completar 2027 a 2033 com a curva de transição descrita na seção 4 do Plano
    ],
    skipDuplicates: true,
  });

  console.log("Seed concluído.");
}

main().finally(() => prisma.$disconnect());
```

Rode com:

```bash
npx tsx prisma/seed.ts
```

E registre no `package.json` (opcional, para `prisma db seed` funcionar):

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 12. Testar localmente

```bash
npm run dev
```

Verifique:

- `GET /api/ramos` retorna os três ramos.
- `GET /api/parametros` retorna os anos 2026–2033.
- `POST /api/simular` com o caso EletroLondrina (custo 100, despesa 20%, margem 35%) devolve preço R$ 155,00 — é o Caso de Teste 1 do Plano de Implementação. Se esse número não bater, não avance para a próxima fase.
- `POST /api/simular` com o caso In-Pacto (custo 100, markup 30%) devolve preço R$ 130,00 — Caso de Teste 2.

---

## 13. Deploy na Vercel

Com o repositório já conectado ao projeto Vercel (fora do escopo deste guia), o deploy acontece a cada push. Só confirme dois pontos na aba **Settings → Environment Variables** do projeto:

- `DATABASE_URL` já deve estar lá, criada automaticamente no passo 2.
- O **Build Command** deve rodar `prisma generate` — isso já acontece via `postinstall`, então normalmente não precisa mexer em nada.

Depois do primeiro deploy, rode o seed apontando para o banco de produção (a `DATABASE_URL` do `.env` puxada pela Vercel já é a de produção/preview, então o mesmo comando do passo 11 funciona):

```bash
npx tsx prisma/seed.ts
```

---

## 14. Checklist final antes do Sprint Day

- [ ] Banco criado na Vercel (Storage → Prisma Postgres).
- [ ] `DATABASE_URL` sincronizada localmente (`vercel env pull`).
- [ ] Schema aplicado (`prisma db push` ou `migrate dev`).
- [ ] Seed rodado em produção — ramos, parâmetros 2026–2033 e os dois casos reais carregados.
- [ ] Casos de Teste 1 e 2 do Plano de Implementação batendo exatamente (R$ 155,00 e R$ 130,00).
- [ ] Testar a demonstração com o wi-fi do local do evento, ou com o celular como ponto de acesso — o app agora depende de rede para falar com o banco, o que o plano original evitava de propósito. Ter um plano B (ex.: dados em cache no cliente, ou vídeo de backup) é recomendado.
- [ ] Variáveis de ambiente conferidas em Production na Vercel, não só em Development.
