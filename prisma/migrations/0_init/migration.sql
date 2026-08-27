-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Ramo" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "aliquotaSugerida" DECIMAL(5,2) NOT NULL,
    "tratamento" TEXT NOT NULL,
    "entraNoMvp" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ramo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroTributario" (
    "id" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "vigencia" TIMESTAMP(3) NOT NULL,
    "fonte" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cbsPct" DECIMAL(6,4) NOT NULL,
    "ibsPct" DECIMAL(6,4) NOT NULL,
    "pisCofinsPct" DECIMAL(6,4) NOT NULL,
    "icmsIssPct" DECIMAL(6,4) NOT NULL,

    CONSTRAINT "ParametroTributario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "ramoId" TEXT,
    "regime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "ramoId" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "formulaTipo" TEXT NOT NULL,
    "custoCompra" DECIMAL(12,2) NOT NULL,
    "despesaFixaPct" DECIMAL(6,4),
    "markupPct" DECIMAL(6,4),
    "margemAlvoPct" DECIMAL(6,4) NOT NULL,
    "margemMinimaPct" DECIMAL(6,4) NOT NULL,
    "aliquotaCustomizada" DECIMAL(6,4),
    "tetoPracaMin" DECIMAL(12,2),
    "tetoPracaMax" DECIMAL(12,2),
    "cenarioRepasse" TEXT NOT NULL DEFAULT 'integral',
    "anosGradual" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoAnual" (
    "id" TEXT NOT NULL,
    "simulacaoId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "margemResultante" DECIMAL(6,4) NOT NULL,
    "tributoTotalPct" DECIMAL(6,4) NOT NULL,
    "piso" DECIMAL(12,2) NOT NULL,
    "teto" DECIMAL(12,2),
    "descontoMaximoPct" DECIMAL(6,4),
    "alertaDisparado" BOOLEAN NOT NULL DEFAULT false,
    "mensagemRecomendacao" TEXT,

    CONSTRAINT "ResultadoAnual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ramo_chave_key" ON "Ramo"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroTributario_ano_key" ON "ParametroTributario"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoAnual_simulacaoId_ano_key" ON "ResultadoAnual"("simulacaoId", "ano");

-- AddForeignKey
ALTER TABLE "Simulacao" ADD CONSTRAINT "Simulacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulacao" ADD CONSTRAINT "Simulacao_ramoId_fkey" FOREIGN KEY ("ramoId") REFERENCES "Ramo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoAnual" ADD CONSTRAINT "ResultadoAnual_simulacaoId_fkey" FOREIGN KEY ("simulacaoId") REFERENCES "Simulacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

