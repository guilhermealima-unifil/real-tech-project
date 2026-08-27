# Real Tech — compatibilidade com Claude Code

@AGENTS.md

Claude Code não carrega `AGENTS.md` automaticamente; a importação acima mantém
as regras operacionais, invariantes, precedência e mapa de documentação iguais
aos usados pelo Codex.

## Instruções específicas do Claude Code

- As skills do projeto para Claude Code ficam em `.claude/skills`.
- Ao alterar conceitualmente uma skill Real Tech, audite a equivalente em
  `.agents/skills` e mantenha o conhecimento compartilhado semanticamente
  igual. Preserve apenas diferenças necessárias de ferramentas, interação,
  descoberta ou permissões.
- Não substitua comandos próprios do Claude Code por comandos do Codex dentro
  de `.claude/skills`.
