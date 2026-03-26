import { z } from "zod";

export const checkoutContactSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters").max(100),
  guestEmail: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase().trim()),
  guestPhone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
  guestNotes: z.string().max(500).optional(),
  pickupTime: z.string().optional(),
});

export const checkoutPaymentSchema = z.object({
  paymentMethod: z.enum(["STRIPE", "PAY_ON_PICKUP"]),
});

export const checkoutSchema = checkoutContactSchema.merge(checkoutPaymentSchema);

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().positive().multipleOf(0.01),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().cuid(),
  images: z.array(z.string().url()).max(5).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const orderStatusSchema = z.enum(["NEW", "READY", "COMPLETED", "CANCELLED", "REFUNDED"]);

export const orderLookupSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase().trim()),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type OrderLookupFormData = z.infer<typeof orderLookupSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
