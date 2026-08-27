# Real Tech

Ferramenta para varejistas de pequeno e médio porte decidirem preço durante a
transição do IBS/CBS: dado o custo, a margem mínima e o preço que a praça
pratica, mostra a faixa viável de preço em cada ano da Reforma (2026–2033) e
termina em uma recomendação — não em um gráfico solto.

Projeto da equipe Real Tech para o **Solveathon SESCAP 2026** (Contexto 01,
Desafio 2). Pitch em 27/08/2026.

## Documentação

- [AGENTS.md](AGENTS.md) — regras operacionais atuais, invariantes, precedência e mapa de contexto para agentes.
- [CLAUDE.md](CLAUDE.md) — entrypoint de compatibilidade do Claude Code; importa as regras compartilhadas de `AGENTS.md`.
- [docs/00-plano-implementacao.md](docs/00-plano-implementacao.md) — cronograma, decisões técnicas, testes de aceitação, riscos.
- [docs/01-passo-a-passo-vercel-prisma.md](docs/01-passo-a-passo-vercel-prisma.md) — como configurar Vercel, Prisma e PostgreSQL.
- [docs/02-especificacao-completa.md](docs/02-especificacao-completa.md) — dados, telas, endpoints, banco, testes, roteiro de apresentação.
- [docs/03-checkpoint2-apresentacao.md](docs/03-checkpoint2-apresentacao.md) — narrativa do pitch do 2º Checkpoint.
- [docs/04-dossie-consolidado.md](docs/04-dossie-consolidado.md) — dossiê completo da jornada (entrevistas, pesquisa de concorrência, Canvas, BMG).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, API routes na Vercel,
Prisma ORM + PostgreSQL (Prisma Postgres via Vercel Marketplace), Vitest para
os testes de aceitação do motor de cálculo.
