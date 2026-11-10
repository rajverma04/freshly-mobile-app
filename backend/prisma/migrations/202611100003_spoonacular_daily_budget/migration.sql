CREATE TABLE "SpoonacularDailyUsage" (
  "day" TEXT NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpoonacularDailyUsage_pkey" PRIMARY KEY ("day"),
  CONSTRAINT "SpoonacularDailyUsage_requestCount_nonnegative" CHECK ("requestCount" >= 0)
);
ALTER TABLE "SpoonacularDailyUsage" ENABLE ROW LEVEL SECURITY;
