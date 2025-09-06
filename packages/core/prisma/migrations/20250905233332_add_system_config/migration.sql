-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "ollama" JSONB NOT NULL,
    "database" JSONB NOT NULL,
    "security" JSONB NOT NULL,
    "performance" JSONB NOT NULL,
    "logging" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);
