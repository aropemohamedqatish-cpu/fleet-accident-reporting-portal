CREATE TABLE "ApiRateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "ApiRateLimitBucket_updatedAt_idx"
ON "ApiRateLimitBucket"("updatedAt");
