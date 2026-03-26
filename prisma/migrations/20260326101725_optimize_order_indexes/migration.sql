-- DropIndex
DROP INDEX "order_number_counter_id_key";

-- DropIndex
DROP INDEX "orders_qrTokenExpiresAt_idx";

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "updatedAt" DROP DEFAULT;
