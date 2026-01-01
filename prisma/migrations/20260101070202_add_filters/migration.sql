-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "filterType" TEXT NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Filter_companyId_idx" ON "Filter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Filter_companyId_fieldName_key" ON "Filter"("companyId", "fieldName");

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
