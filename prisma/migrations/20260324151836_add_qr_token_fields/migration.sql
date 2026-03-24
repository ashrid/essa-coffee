-- Add QR token fields to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrTokenExpiresAt" TIMESTAMP(3);

-- Create index for faster QR token lookups
CREATE INDEX IF NOT EXISTS "orders_qrToken_idx" ON "orders"("qrToken");
