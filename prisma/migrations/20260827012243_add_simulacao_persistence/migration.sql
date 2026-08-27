-- DropIndex
DROP INDEX "ResultadoAnual_simulacaoId_ano_key";

-- AlterTable
ALTER TABLE "ResultadoAnual" ADD COLUMN     "cenario" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Simulacao" ADD COLUMN     "prazoPagamentoFornecedorDias" INTEGER,
ADD COLUMN     "ramoAliquotaSugerida" DECIMAL(5,2),
ADD COLUMN     "ramoRotulo" TEXT,
ALTER COLUMN "rotulo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ImpactoCaixaAnual" (
    "id" TEXT NOT NULL,
    "simulacaoId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "valorProtegido" DECIMAL(12,2) NOT NULL,
    "valorEmRisco" DECIMAL(12,2) NOT NULL,
    "mensagemRecomendacao" TEXT,

    CONSTRAINT "ImpactoCaixaAnual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImpactoCaixaAnual_simulacaoId_ano_key" ON "ImpactoCaixaAnual"("simulacaoId", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoAnual_simulacaoId_cenario_ano_key" ON "ResultadoAnual"("simulacaoId", "cenario", "ano");

-- AddForeignKey
ALTER TABLE "ImpactoCaixaAnual" ADD CONSTRAINT "ImpactoCaixaAnual_simulacaoId_fkey" FOREIGN KEY ("simulacaoId") REFERENCES "Simulacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

