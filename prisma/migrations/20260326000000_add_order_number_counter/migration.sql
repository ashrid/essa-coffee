-- CreateOrderNumberCounterTable
CREATE TABLE IF NOT EXISTS "order_number_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_number_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "order_number_counter_id_key" ON "order_number_counter"("id");
