import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Parâmetros PROVISÓRIOS — não validados com contador.
 * Ver docs/05-parametros-tributarios-provisorios.md para as fontes e o
 * checklist do que falta confirmar antes do Sprint Day.
 */
const FONTE_PROVISORIA =
  "LC 214/2025 (curva de transição) — PROVISÓRIO, não validado com contador. Ver docs/05-parametros-tributarios-provisorios.md";

async function main() {
  await prisma.ramo.createMany({
    data: [
      {
        chave: "eletro",
        rotulo: "Eletrodomésticos e móveis",
        aliquotaSugerida: 26.5,
        tratamento: "padrao",
      },
      {
        chave: "eletrico",
        rotulo: "Material elétrico e construção",
        aliquotaSugerida: 26.5,
        tratamento: "padrao",
      },
      {
        chave: "vestuario",
        rotulo: "Vestuário e calçados",
        aliquotaSugerida: 26.5,
        tratamento: "padrao",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.parametroTributario.createMany({
    data: [
      { ano: 2026, cbsPct: 0.9, ibsPct: 0.1, pisCofinsPct: 3.65, icmsIssPct: 18 },
      { ano: 2027, cbsPct: 8.8, ibsPct: 0.1, pisCofinsPct: 0, icmsIssPct: 18 },
      { ano: 2028, cbsPct: 8.8, ibsPct: 0.1, pisCofinsPct: 0, icmsIssPct: 18 },
      { ano: 2029, cbsPct: 8.8, ibsPct: 1.77, pisCofinsPct: 0, icmsIssPct: 16.2 },
      { ano: 2030, cbsPct: 8.8, ibsPct: 3.54, pisCofinsPct: 0, icmsIssPct: 14.4 },
      { ano: 2031, cbsPct: 8.8, ibsPct: 5.31, pisCofinsPct: 0, icmsIssPct: 12.6 },
      { ano: 2032, cbsPct: 8.8, ibsPct: 7.08, pisCofinsPct: 0, icmsIssPct: 10.8 },
      { ano: 2033, cbsPct: 8.8, ibsPct: 17.7, pisCofinsPct: 0, icmsIssPct: 0 },
    ].map((linha) => ({
      ...linha,
      versao: "2026-08-provisorio",
      vigencia: new Date("2026-08-25"),
      fonte: FONTE_PROVISORIA,
    })),
    skipDuplicates: true,
  });

  const ramoEletro = await prisma.ramo.findUniqueOrThrow({ where: { chave: "eletro" } });
  const ramoEletrico = await prisma.ramo.findUniqueOrThrow({ where: { chave: "eletrico" } });

  const eletrolondrina = await prisma.empresa.upsert({
    where: { cnpj: "00000000000191" },
    update: {},
    create: {
      nome: "EletroLondrina",
      cnpj: "00000000000191",
      ramoId: ramoEletro.id,
      regime: "simples",
    },
  });

  const inPacto = await prisma.empresa.upsert({
    where: { cnpj: "00000000000272" },
    update: {},
    create: {
      nome: "Grupo In-Pacto",
      cnpj: "00000000000272",
      ramoId: ramoEletrico.id,
      regime: "lucroReal",
    },
  });

  await prisma.simulacao.upsert({
    where: { id: "seed-caso-eletrolondrina" },
    update: {},
    create: {
      id: "seed-caso-eletrolondrina",
      empresaId: eletrolondrina.id,
      ramoId: ramoEletro.id,
      rotulo: "Caso EletroLondrina",
      formulaTipo: "multiplicador",
      custoCompra: 100,
      despesaFixaPct: 0.2,
      margemAlvoPct: 0.35,
      margemMinimaPct: 0.3,
      // Sem tetoPraca: "155 a 160" (Documento 0, Teste 1) é a faixa do PREÇO
      // CALCULADO por ela (despesa/margem "em torno de" 20%/35%, por isso varia),
      // não o preço da concorrência. Nenhuma entrevista deu um número de teto de
      // praça — mesma situação do In-Pacto, ver observação abaixo.
      cenarioRepasse: "integral",
    },
  });

  await prisma.simulacao.upsert({
    where: { id: "seed-caso-inpacto" },
    update: {},
    create: {
      id: "seed-caso-inpacto",
      empresaId: inPacto.id,
      ramoId: ramoEletrico.id,
      rotulo: "Caso Grupo In-Pacto",
      formulaTipo: "markup",
      custoCompra: 100,
      markupPct: 0.3,
      margemAlvoPct: 0.3,
      // Markup mínimo relatado na entrevista É o piso: "não se pode perder a margem".
      margemMinimaPct: 0.3,
      // Sem tetoPraca: nenhuma entrevista deu um número — na prática o preço do
      // concorrente chega no momento da venda, vindo do próprio cliente (ver
      // docs/04-dossie-consolidado.md, seção 5.2), não é um dado pré-cadastrado.
      cenarioRepasse: "integral",
    },
  });

  console.log("Seed concluído: 3 ramos, 8 anos de parâmetros tributários (provisórios), 2 empresas e 2 simulações reais.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
