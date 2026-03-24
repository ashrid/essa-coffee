-- Add QR token fields to Order table for pickup verification
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrTokenExpiresAt" TIMESTAMP(3);

-- Create unique index for QR token lookups
CREATE UNIQUE INDEX IF NOT EXISTS "Order_qrToken_key" ON "orders"("qrToken");
