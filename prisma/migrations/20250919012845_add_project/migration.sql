-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "siteAddress" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "sizeStoreys" INTEGER,
    "budgetBand" TEXT,
    "targetTimeline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
