/*
  Warnings:

  - You are about to drop the column `category` on the `Business` table. All the data in the column will be lost.
  - Added the required column `businessCategoryId` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessCategoryId` to the `CatalogProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Business_category_idx";

-- DropIndex
DROP INDEX "Business_slug_idx";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "category",
ADD COLUMN     "businessCategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN     "businessCategoryId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "BusinessCategory";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "businessCategoryId" TEXT NOT NULL,
    "parent_id" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCounter" (
    "businessId" TEXT NOT NULL,
    "nextProductSku" INTEGER NOT NULL DEFAULT 1001,

    CONSTRAINT "BusinessCounter_pkey" PRIMARY KEY ("businessId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_businessCategoryId_idx" ON "Category"("businessCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_businessCategoryId_slug_key" ON "Category"("businessCategoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_slug_key" ON "BusinessCategory"("slug");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCounter" ADD CONSTRAINT "BusinessCounter_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
