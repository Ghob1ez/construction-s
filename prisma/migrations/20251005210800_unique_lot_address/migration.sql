/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Lot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lot_address_key" ON "public"."Lot"("address");
