CREATE TABLE "RecipeSearchCache" (
  "id" TEXT NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "offset" INTEGER NOT NULL,
  "totalResults" INTEGER NOT NULL,
  "results" JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecipeSearchCache_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RecipeSearchCache_cacheKey_key" ON "RecipeSearchCache"("cacheKey");
CREATE INDEX "RecipeSearchCache_expiresAt_idx" ON "RecipeSearchCache"("expiresAt");
ALTER TABLE "RecipeSearchCache" ENABLE ROW LEVEL SECURITY;
