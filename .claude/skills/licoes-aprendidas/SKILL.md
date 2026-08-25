---
name: licoes-aprendidas
description: Padrões e erros específicos deste projeto (Real Tech) que já aconteceram ou foram estabelecidos pelo usuário durante o desenvolvimento — consultar antes de repetir uma decisão de tooling/infra parecida, e atualizar sempre que um novo padrão ou erro surgir.
---

# Lições aprendidas — Real Tech

Registro vivo de padrões e erros deste projeto específico. Sempre que um
erro se repetir ou o usuário estabelecer um padrão de trabalho novo,
adicionar uma entrada aqui — não deixar para lembrar de cabeça na próxima
sessão. Cada entrada deve dizer o que aconteceu/foi pedido e a regra
prática que se aplica daqui pra frente.

## Como este time gosta de trabalhar

- **Perguntar antes de decidir, sempre que houver mais de uma opção
  razoável** — mesmo quando os documentos "recomendam" um caminho (região
  de banco, provedor, versão de dependência, nome de arquivo). O usuário
  pediu explicitamente para nunca induzir decisão, principalmente de
  arquitetura. Na dúvida, `AskUserQuestion` em vez de escolher.
- **Commits pequenos e auditáveis, por assunto** (ex: scaffold separado de
  docs, separado de CLAUDE.md, separado de setup do Prisma) — não um
  commit único com tudo. Confirmar antes de cada `git push`, mesmo que um
  push anterior já tenha sido autorizado — autorização não carrega
  automaticamente para o próximo lote de mudanças.
- **Nunca imprimir segredo/token completo no chat** (ex: `VERCEL_OIDC_TOKEN`,
  `DATABASE_URL`). Para confirmar que uma env var existe ou tem o formato
  esperado, usar `grep`/`sed` para mostrar só o nome da variável ou o
  prefixo do protocolo, nunca o valor inteiro.
- **Quando um documento assume uma estrutura de pastas diferente da
  escolhida no projeto** (ex: docs assumem `app/` na raiz, projeto usa
  `src/`), não traduzir os caminhos silenciosamente — registrar a
  divergência em `CLAUDE.md`, seção "Divergências do Documento 1", para
  ficar auditável.

## Tooling / infra

- **`create-next-app` recusa rodar em diretório não-vazio**, mesmo com só
  um `README.md`. Solução: gerar o scaffold em um diretório separado
  (scratchpad) e copiar os arquivos para o projeto depois — não vale a
  pena tentar mover arquivos do projeto para fora dele (isso é bloqueado
  pelo classificador de permissão do Claude Code); mover para uma pasta
  oculta *dentro* do próprio projeto funciona.
- **Não instalar pacotes voláteis pela tag `latest` sem checar
  `npm view <pkg> dist-tags`.** Aconteceu com o `prisma`: `latest` apontava
  para `8.0.0-rc.10` (release candidate com mudança arquitetural grande),
  enquanto `@prisma/client` `latest` ainda era `7.10.0` estável —
  desalinhamento de major version entre pacotes que deveriam andar juntos.
  Fixar versões explícitas (`--save-exact`) quando isso acontecer.
- **`npm audit fix --force` pode rebaixar uma versão escolhida
  deliberadamente.** Sempre ler o que o fix proposto realmente faz antes de
  rodar — se ele resolve uma vulnerabilidade de baixo risco (ex: DoS em
  ferramenta de CLI local) rebaixando um major version que acabamos de
  fixar por um motivo, o fix é pior que o problema.
- **`prisma init` (v7+) instala automaticamente skills de referência**
  em `.claude/skills/`, `.agents/skills/` e `.windsurf/skills/`. As cópias
  em `.claude/` e `.windsurf/` são **symlinks** apontando para
  `.agents/skills/` — apagar `.agents/` sem perceber quebra os links. Se for
  remover as pastas de ferramentas não usadas, primeiro copiar o conteúdo
  real (ou clonar `github.com/prisma/skills`) para dentro de `.claude/skills/`
  como arquivos de verdade, só depois apagar `.agents/`/`.windsurf/`.
- **O primeiro `Write` da sessão gravou `README.md` em UTF-16 no disco**
  (bytes intercalados com `0x00`), mesmo sem usar PowerShell — só foi
  percebido bem depois, ao reler o arquivo. `file <arquivo>` ou
  `xxd <arquivo> | head` confirmam o encoding real. Os demais arquivos
  escritos na mesma sessão saíram em UTF-8 normalmente, então parece ter
  sido um problema pontual — mas vale conferir o encoding de um arquivo com
  acentuação logo depois de criá-lo, em vez de assumir que "escrito com
  sucesso" significa "codificado certo".
- **`.gitignore` com `.env*` também ignora `.env.example`.** Se quiser um
  arquivo de exemplo versionado, adicionar uma linha de negação
  (`!.env.example`) depois do padrão amplo.
