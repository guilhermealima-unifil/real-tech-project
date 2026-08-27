---
name: licoes-aprendidas
description: Consulta e mantém padrões, decisões de trabalho e erros já observados no Real Tech. Use antes de repetir decisões de tooling, infraestrutura ou interpretação de dados do projeto.
---

# Lições aprendidas — Real Tech

Registro vivo de padrões específicos deste projeto. Ao surgir uma nova decisão
durável ou um erro com chance real de repetição, acrescente uma regra prática e
o contexto necessário para aplicá-la. Não transforme um caso isolado em regra
universal.

## Como este time trabalha

- Quando houver mais de uma opção razoável com impacto de arquitetura,
  infraestrutura, provedor ou versão, exponha os trade-offs e obtenha a decisão
  do usuário pelo mecanismo de interação disponível no agente. Não presuma uma
  escolha só porque um documento antigo a recomenda.
- Prefira commits pequenos e auditáveis por assunto. Nunca faça commit ou push
  sem solicitação explícita; uma autorização de push não vale automaticamente
  para um lote posterior.
- Nunca imprima secrets, tokens ou connection strings completos. Para verificar
  uma variável, mostre apenas sua existência ou um trecho não sensível.
- Quando documentação histórica usar caminhos ou convenções diferentes do
  projeto atual, siga a precedência de `AGENTS.md` e registre a divergência na
  fonte operacional compartilhada apropriada, sem alterar silenciosamente o
  significado.

## Dados de negócio

- Não confunda “preço calculado confirmado pela entrevistada” com teto de
  praça. No caso EletroLondrina, R$ 155–160 descrevia o próprio preço calculado,
  não uma cotação comprovada de concorrente.
- `tetoPraca` frequentemente é informado durante a venda pelo próprio cliente.
  Quando a entrevista não fornece valor numérico, `null` é correto; não invente
  estimativa ou placeholder.

## Tooling e infraestrutura

- `tsx prisma/seed.ts` não carrega `.env` sozinho. O script precisa importar
  `dotenv/config`; a configuração da CLI Prisma não é carregada ao executar o
  arquivo diretamente.
- `create-next-app` recusa diretório não vazio. Gere o scaffold em diretório
  temporário e copie apenas o necessário, preservando os arquivos existentes.
- Antes de instalar pacote volátil por `latest`, confira os dist-tags. Prisma
  está fixado em `7.10.0`; não faça upgrade de major sem decisão explícita.
- Leia a proposta de `npm audit fix --force` antes de executá-la: ela pode
  rebaixar ou substituir versões escolhidas deliberadamente.
- As árvores `.agents/skills` e `.claude/skills` são diretórios físicos
  separados neste repositório. Não presuma symlink. Mudanças conceituais em
  skills Real Tech devem ser refletidas semanticamente nas duas árvores;
  preserve diferenças realmente específicas de Codex ou Claude Code.
- Depois de criar arquivo com acentuação, confirme que está em UTF-8; uma
  gravação anterior produziu UTF-16 inesperadamente.
- O padrão `.env*` também ignora `.env.example`; mantenha `!.env.example`
  depois do padrão amplo quando o exemplo precisar ser versionado.
