import { Router } from "express";
import { getAuth } from "@clerk/express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { authenticated, requireRole } from "../../middleware/auth.js";
import { HttpError } from "../../middleware/errors.js";
import {
  NEXT_STATUS_MAP,
  type OrderStatus,
  orderSchema,
  totals,
} from "./order.schema.js";

export const ordersRouter = Router();
ordersRouter.use(authenticated);

ordersRouter.get("/me", requireRole("user", "staff", "admin"), async (req, res) => {
  const { userId } = getAuth(req);
  const { clerkClient } = await import("@clerk/express");
  const user = await clerkClient.users.getUser(userId!);
  const rawRole = user.publicMetadata.role;
  const role = rawRole === "admin" || rawRole === "staff" ? rawRole : "user";
  res.json({ role });
});

// User: View current user's order history
ordersRouter.get("/", async (req, res) => {
  res.json(
    await prisma.order.findMany({
      where: { userId: getAuth(req).userId! },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  );
});

// Kitchen: View all incoming orders across all customers
ordersRouter.get("/kitchen/live", requireRole("staff", "admin"), async (_req, res) => {
  res.json(
    await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
});

// Kitchen: Advance any order's status
ordersRouter.post("/kitchen/:id/advance", requireRole("staff", "admin"), async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { items: true },
  });
  if (!order) throw new HttpError(404, "Order not found");

  const current = order.status as OrderStatus;
  const nextStatus = NEXT_STATUS_MAP[current];
  if (!nextStatus) {
    throw new HttpError(
      400,
      `Order is already ${current} and cannot be advanced further.`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: nextStatus },
    include: { items: true },
  });
  res.json(updated);
});

// Kitchen: Cancel an order
ordersRouter.post("/kitchen/:id/cancel", requireRole("staff", "admin"), async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { items: true },
  });
  if (!order) throw new HttpError(404, "Order not found");

  const current = order.status as OrderStatus;
  if (["DELIVERED", "CANCELLED"].includes(current)) {
    throw new HttpError(
      400,
      `Order is already ${current.toLowerCase()} and cannot be cancelled.`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
    include: { items: true },
  });
  res.json(updated);
});

// Admin: Revenue and Sales Analytics
ordersRouter.get("/admin/analytics", requireRole("admin"), async (_req, res) => {
  const allOrders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  let totalRevenue = 0;
  let todayRevenue = 0;
  let activeCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let codOrdersCount = 0;
  let onlineOrdersCount = 0;
  let codRevenue = 0;
  let onlineRevenue = 0;

  const dishSalesMap: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};

  for (const order of allOrders) {
    const isCancelled = order.status === "CANCELLED";
    const isActive = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
    ].includes(order.status);
    const isDelivered = order.status === "DELIVERED";

    if (isActive) activeCount++;
    if (isDelivered) deliveredCount++;
    if (isCancelled) cancelledCount++;

    const orderItems = order.items.map((i) => ({
      price: i.unitPrice,
      quantity: i.quantity,
    }));
    const { total } = totals(orderItems);

    const addr = (order.address as Record<string, unknown>) || {};
    const paymentMethod = addr.paymentMethod === "ONLINE" ? "ONLINE" : "COD";

    if (!isCancelled) {
      totalRevenue += total;

      if (new Date(order.createdAt) >= startOfToday) {
        todayRevenue += total;
      }

      if (paymentMethod === "ONLINE") {
        onlineOrdersCount++;
        onlineRevenue += total;
      } else {
        codOrdersCount++;
        codRevenue += total;
      }

      for (const item of order.items) {
        if (!dishSalesMap[item.foodId]) {
          dishSalesMap[item.foodId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        dishSalesMap[item.foodId].quantity += item.quantity;
        dishSalesMap[item.foodId].revenue += item.unitPrice * item.quantity;
      }
    }
  }

  const topSellers = Object.values(dishSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const nonCancelledOrders = allOrders.length - cancelledCount;
  const averageOrderValue =
    nonCancelledOrders > 0 ? Math.round(totalRevenue / nonCancelledOrders) : 0;

  res.json({
    totalRevenue,
    todayRevenue,
    totalOrders: allOrders.length,
    activeCount,
    deliveredCount,
    cancelledCount,
    averageOrderValue,
    codOrdersCount,
    onlineOrdersCount,
    codRevenue,
    onlineRevenue,
    topSellers,
  });
});

// User: Specific order by ID
ordersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId: getAuth(req).userId! },
    include: { items: true },
  });
  if (!order) throw new HttpError(404, "Order not found");
  res.json(order);
});

// Live Location Tracking for order
ordersRouter.get("/:id/track", async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId: getAuth(req).userId! },
    include: { items: true },
  });
  if (!order) throw new HttpError(404, "Order not found");

  const addr = (order.address as Record<string, string>) || {};
  const destinationAddress = addr.line
    ? `${addr.line}, ${addr.city || ""}`
    : "Customer Residence";

  // Coordinates anchor points (e.g. Bangalore Kitchen to Customer area)
  const restaurantCoords = {
    name: "Freshly Central Kitchen",
    address: "100 Feet Road, Indiranagar",
    latitude: 12.9716,
    longitude: 77.5946,
  };

  const destCoords = {
    address: destinationAddress,
    latitude: 12.9352,
    longitude: 77.6245,
  };

  const status = order.status as OrderStatus;

  // Calculate live progress
  let progressPercent = 0;
  let etaMinutes = 25;
  let distanceRemainingKm = 4.2;
  let currentMilestone = "Order queued at kitchen";
  let speedKmH = 0;

  if (status === "DELIVERED") {
    progressPercent = 100;
    etaMinutes = 0;
    distanceRemainingKm = 0;
    currentMilestone = "Order delivered! Enjoy your meal 🍽️";
    speedKmH = 0;
  } else if (status === "OUT_FOR_DELIVERY") {
    // Delivery window is simulated over 15 minutes (900 seconds)
    const elapsedSeconds = Math.max(
      0,
      (Date.now() - new Date(order.createdAt).getTime()) / 1000,
    );
    const fraction = Math.min(0.95, elapsedSeconds / 900);
    progressPercent = Math.round(fraction * 100);

    distanceRemainingKm = Math.max(
      0.2,
      Number(((1 - fraction) * 4.2).toFixed(1)),
    );
    etaMinutes = Math.max(2, Math.round((1 - fraction) * 15));
    speedKmH = fraction > 0.85 ? 14 : 32;

    if (fraction < 0.25) {
      currentMilestone = "Rider picked up hot order from kitchen 🍳";
    } else if (fraction < 0.6) {
      currentMilestone = "Rider en route on 100 Ft Expressway 🛵";
    } else if (fraction < 0.85) {
      currentMilestone = "Rider entered your neighbourhood 📍";
    } else {
      currentMilestone = "Rider arriving outside your building 🚪";
    }
  } else if (status === "PREPARING") {
    progressPercent = 10;
    etaMinutes = 20;
    distanceRemainingKm = 4.2;
    currentMilestone = "Chefs freshly cooking in the kitchen 👨‍🍳";
  } else if (status === "CONFIRMED") {
    progressPercent = 5;
    etaMinutes = 25;
    distanceRemainingKm = 4.2;
    currentMilestone = "Kitchen confirmed and assigned delivery partner ✓";
  }

  const fraction = progressPercent / 100;
  const riderLat =
    restaurantCoords.latitude +
    (destCoords.latitude - restaurantCoords.latitude) * fraction;
  const riderLng =
    restaurantCoords.longitude +
    (destCoords.longitude - restaurantCoords.longitude) * fraction;

  res.json({
    orderId: order.id,
    status,
    rider: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      vehicle: "Bajaj Pulsar 150 · KA 01 EQ 4920",
      rating: 4.9,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    },
    restaurant: restaurantCoords,
    destination: destCoords,
    riderLocation: {
      latitude: riderLat,
      longitude: riderLng,
      heading: 45,
      speedKmH,
    },
    progressPercent,
    etaMinutes,
    distanceRemainingKm,
    currentMilestone,
  });
});

// User: Cancel own placed order
ordersRouter.post("/:id/cancel", async (req, res) => {
  const userId = getAuth(req).userId!;
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId },
    include: { items: true },
  });
  if (!order) throw new HttpError(404, "Order not found");

  const current = order.status as OrderStatus;
  if (!["PLACED", "CONFIRMED"].includes(current)) {
    throw new HttpError(
      400,
      `Order is already ${current.toLowerCase()} and cannot be cancelled.`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
    include: { items: true },
  });
  res.json(updated);
});

// User: Place a new order
ordersRouter.post("/", async (req, res) => {
  const input = orderSchema.parse(req.body);
  const userId = getAuth(req).userId!;
  const key = {
    userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
  };
  const existing = await prisma.order.findUnique({
    where: key,
    include: { items: true },
  });
  if (existing) {
    res.json(existing);
    return;
  }
  try {
    const order = await prisma.$transaction(async (tx) => {
      const foods = await tx.food.findMany({
        where: {
          id: { in: input.items.map((i) => i.foodId) },
          available: true,
        },
      });
      if (foods.length !== input.items.length)
        throw new HttpError(
          409,
          "An item is no longer available. Please update your cart.",
        );
      const items = input.items.map((item) => {
        const food = foods.find((f) => f.id === item.foodId)!;
        return {
          foodId: food.id,
          name: food.name,
          unitPrice: food.price,
          quantity: item.quantity,
        };
      });
      return tx.order.create({
        data: {
          userId,
          idempotencyKey: input.idempotencyKey,
          address: input.address,
          ...totals(
            items.map((i) => ({ price: i.unitPrice, quantity: i.quantity })),
          ),
          items: { create: items },
        },
        include: { items: true },
      });
    });
    res.status(201).json(order);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.json(
        await prisma.order.findUniqueOrThrow({
          where: key,
          include: { items: true },
        }),
      );
      return;
    }
    throw error;
  }
});
