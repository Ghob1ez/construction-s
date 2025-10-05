-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "lotId" TEXT,
ALTER COLUMN "siteAddress" DROP NOT NULL,
ALTER COLUMN "projectType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Lot" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zoneCode" TEXT,
    "council" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "maxHeightM" DECIMAL(6,2),
    "fsr" DECIMAL(5,2),
    "minLotSizeSqm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
