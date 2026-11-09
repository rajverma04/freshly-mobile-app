import { z } from "zod";

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const NEXT_STATUS_MAP: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    address: z.object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().regex(/^\+?[0-9]{10,15}$/),
      line: z.string().trim().min(8).max(300),
      city: z.string().trim().min(2).max(100),
      postalCode: z.string().regex(/^[0-9]{6}$/),
      paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
      paymentStatus: z.enum(["PENDING", "PAID"]).default("PENDING"),
      deliveryNotes: z.string().max(300).optional(),
      promoCode: z.string().max(30).optional(),
      discount: z.number().int().nonnegative().optional(),
    }),
    items: z
      .array(
        z.object({
          foodId: z.string().min(1),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(30),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.items.map((i) => i.foodId)).size !== value.items.length)
      ctx.addIssue({ code: "custom", message: "Duplicate food items" });
  });

export function totals(items: { price: number; quantity: number }[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = subtotal >= 50000 ? 0 : 3900;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}
