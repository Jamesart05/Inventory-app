/*
  Warnings:

  - You are about to drop the column `sellingPrice` on the `items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "items" DROP COLUMN "sellingPrice",
ADD COLUMN     "retailPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "wholesalePrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");
