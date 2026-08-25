# Parâmetros tributários 2026–2033 — PROVISÓRIOS, a validar com o contador

**Status: NÃO validado com o Jonathas Oliveira (Tetra Auditoria) ou qualquer
outro contador.** Este documento existe para que a equipe saiba exatamente
o que precisa ser confirmado antes do Sprint Day (27/08/2026), e não
confunda os números abaixo com dado definitivo. Os documentos 00 e 04 são
explícitos: "as regras da transição ainda mudam... os parâmetros ficam em
um arquivo versionado e editável, separado do motor."

**Quando validar: Sprint Day, 26/08/2026** (o dia de construção presencial
que antecede o pitch de 27/08). Até lá este checklist fica propositalmente
em aberto — não é bloqueio de código, é o único item da lista que depende
de uma conversa humana com quem entende de tributo. Enquanto isso, os
números da tabela abaixo continuam servindo para testar o motor e as
telas, só não podem ser citados como definitivos na apresentação.

## De onde vieram esses números

Pesquisa na web feita em 25/08/2026 sobre o cronograma de transição da
LC 214/2025 (Reforma Tributária do Consumo). Duas fontes secundárias
consultadas deram números ligeiramente diferentes entre si para a alíquota
de referência da CBS e para o total consolidado em 2033 (26,5% vs 27%) —
o que já é, por si só, um sinal de que **a alíquota de referência final
ainda depende de resolução do Senado Federal, que não foi editada**. A
tabela abaixo usa a fonte cujo total bate com o número que os próprios
Documentos 0 e 1 da equipe já usavam (26,5%), por consistência interna —
não porque seja necessariamente mais correta.

Fontes consultadas:
- [Cronograma da reforma tributária: 2026 a 2033 ano a ano — Buscador NCM](https://buscadorncm.com.br/blog/cronograma-reforma-tributaria-ano-a-ano)
- [Alíquotas da Reforma Tributária 2026 a 2033 (CBS e IBS) — Banana Software](https://bananasoft.ai/dados/aliquotas-reforma-tributaria)

## A estrutura da transição (isso é o que está na lei, não deveria mudar)

- **2026** — fase de teste: CBS 0,9% + IBS 0,1%, compensáveis com PIS/Cofins
  (não é cobrança real). PIS/Cofins e ICMS/ISS continuam 100% ativos.
- **2027** — PIS e Cofins são **extintos**. CBS passa a valer pela alíquota
  de referência cheia. ICMS/ISS continuam 100% ativos (a substituição deles
  só começa em 2029).
- **2028** — igual a 2027, sem mudança adicional relevante.
- **2029 a 2032** — ICMS e ISS são reduzidos em 10 pontos percentuais ao ano
  (90% → 80% → 70% → 60% do valor original), e o IBS assume a fatia
  equivalente.
- **2033** — ICMS e ISS **extintos**. Sistema pleno: só CBS + IBS.

## Tabela usada no seed (provisória)

Percentual inteiro (18 = 18%), igual à convenção do `ParametroTributario`
usada no motor (ver `src/lib/motor.ts` e `CLAUDE.md`).

| Ano | cbsPct | ibsPct | pisCofinsPct | icmsIssPct | Total |
|---|---|---|---|---|---|
| 2026 | 0,90 | 0,10 | 3,65 | 18,00 | 22,65 |
| 2027 | 8,80 | 0,10 | 0,00 | 18,00 | 26,90 |
| 2028 | 8,80 | 0,10 | 0,00 | 18,00 | 26,90 |
| 2029 | 8,80 | 1,77 | 0,00 | 16,20 | 26,77 |
| 2030 | 8,80 | 3,54 | 0,00 | 14,40 | 26,74 |
| 2031 | 8,80 | 5,31 | 0,00 | 12,60 | 26,71 |
| 2032 | 8,80 | 7,08 | 0,00 | 10,80 | 26,68 |
| 2033 | 8,80 | 17,70 | 0,00 | 0,00 | 26,50 |

**De onde veio o `pisCofinsPct = 3,65` e o `icmsIssPct = 18,00` de 2026**:
não são universais — PIS/Cofins varia entre regime cumulativo (3,65%) e
não-cumulativo (9,25%), e ICMS varia por estado e por produto (em geral
17% a 20% + ISS de serviços 2% a 5%). Os valores acima são os mesmos que
já apareciam como exemplo ilustrativo no Documento 1 (seção 11) — mantidos
aqui só para não introduzir um terceiro número não relacionado a nenhum
documento da equipe. A redução de 2029 a 2032 foi aplicada sobre esse
mesmo valor-base (18,00 × 90%, 80%, 70%, 60%).

## Checklist do que precisa ser confirmado com o contador antes do Sprint Day

- [ ] A alíquota de referência da CBS (usei 8,80% para 2027–2033 — uma das
      duas fontes pesquisadas usava 8,40% só para 2027–2028).
- [ ] A alíquota de referência do IBS em 2033 (usei 17,70% — a outra fonte
      pesquisada indicava algo como 18,50%, resultando em 27% total em vez
      de 26,5%).
- [ ] Se faz sentido usar `pisCofinsPct = 3,65` (regime cumulativo) como
      padrão para os três ramos do MVP, ou se `9,25` (não-cumulativo) é
      mais representativo do perfil de varejo entrevistado.
- [ ] Se `icmsIssPct = 18,00` é uma aproximação razoável para Londrina/PR
      nos três ramos do MVP (eletrodomésticos e móveis, material elétrico
      e construção, vestuário e calçados), ou se cada ramo precisa de um
      valor diferente.
- [ ] Confirmar que a leitura da "escada" de redução do ICMS/ISS (2029:
      90%, 2030: 80%, 2031: 70%, 2032: 60%, 2033: 0%) está correta — há
      alguma divergência entre fontes sobre se a redução começa exatamente
      em 2029 ou se os primeiros anos (2027–2028) já têm alguma redução
      residual.
- [ ] `Ramo.aliquotaSugerida = 26,5%` para os três ramos do MVP (igual ao
      exemplo do Documento 1) — confirmar se é razoável usar o mesmo valor
      para os três, ou se algum deles deveria ter uma alíquota diferente.

**Enquanto este checklist não estiver marcado, qualquer número que a
aplicação mostrar deve ser tratado como estimativa — é exatamente o
discurso já preparado para o Q&A do jurado (Documento 2, seção 8.2):
"a precisão do centavo é trabalho do contador".**

## Perguntas para o contador (roteiro em linguagem simples)

Escrito para quem só entende de código, não de tributo — leia literalmente
para o Jonathas (ou outro contador) no Sprint Day. Cada pergunta corresponde
a um item do checklist acima; a resposta vai direto para a tabela do seed
(`prisma/seed.ts`) e para `ParametroTributarioAno` em `src/lib/motor.ts`.

1. **"Qual é a alíquota de referência da CBS, ano a ano, de 2027 até 2033?"**
   — hoje o app usa 8,80% fixo nesse período. Se a resposta variar ano a
   ano, precisamos da lista completa, não só de um número.
2. **"E a alíquota de referência do IBS, especificamente a de 2033 (quando a
   transição termina)?"** — hoje o app usa 17,70%. Isso é o que mais muda o
   total: a diferença entre 26,5% e 27% (a outra fonte que pesquisamos)
   vem quase toda daqui.
3. **"Para uma loja de varejo pequena/média, é mais realista usar o PIS/Cofins
   do regime cumulativo (3,65%) ou do não-cumulativo (9,25%) como padrão?"**
   — pergunte também se isso muda por ramo (eletro/móveis, material
   elétrico/construção, vestuário/calçados) ou se dá pra usar um só valor
   para os três.
4. **"18% de ICMS/ISS é uma aproximação razoável para uma loja em Londrina/PR
   nesses três ramos, ou isso varia demais para ter um número único?"** — se
   variar por ramo, precisamos de um valor por ramo, não um valor global.
5. **"A redução do ICMS/ISS entre 2029 e 2032 realmente começa em 2029 (90%
   do valor original) e cai 10 pontos percentuais por ano até sumir em
   2033? Ou já existe alguma redução em 2027/2028?"** — é a pergunta mais
   fácil de confirmar porque está na letra da lei (LC 214/2025), então é
   mais para confirmar que lemos certo do que para obter um dado novo.
6. **"Faz sentido usar 26,5% como a alíquota de referência sugerida para os
   três ramos do MVP, ou algum deles deveria aparecer com um número
   diferente na tela?"** — essa é só a alíquota de exibição/sugestão
   (`Ramo.aliquotaSugerida`), não entra no cálculo do preço; é a alíquota
   individual (pergunta 1–4) que decide o resultado.

Não é necessário perguntar sobre "cenário de repasse" (integral/gradual/
absorção) — isso é uma escolha de estratégia de preço do lojista, não uma
regra tributária, e já foi decidido em código (ver CLAUDE.md, seção
"Desenho do motor"). O contador só entra nos seis pontos acima.
