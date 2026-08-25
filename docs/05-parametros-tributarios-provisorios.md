# Parâmetros tributários 2026–2033 — PROVISÓRIOS, a validar com o contador

**Status: NÃO validado com o Jonathas Oliveira (Tetra Auditoria) ou qualquer
outro contador.** Este documento existe para que a equipe saiba exatamente
o que precisa ser confirmado antes do Sprint Day (27/08/2026), e não
confunda os números abaixo com dado definitivo. Os documentos 00 e 04 são
explícitos: "as regras da transição ainda mudam... os parâmetros ficam em
um arquivo versionado e editável, separado do motor."

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
