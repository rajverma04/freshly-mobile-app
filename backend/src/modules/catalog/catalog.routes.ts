import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const catalogRouter = Router();

catalogRouter.get("/", async (req, res) => {
  const { query, category } = z
    .object({
      query: z.string().max(100).default(""),
      category: z.string().max(50).optional(),
    })
    .parse(req.query);

  res.json(
    await prisma.food.findMany({
      where: {
        available: true,
        name: { contains: query, mode: "insensitive" },
        ...(category ? { category } : {}),
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
  );
});

// Admin / Kitchen: List all items including out of stock
catalogRouter.get("/admin", async (_req, res) => {
  res.json(
    await prisma.food.findMany({
      orderBy: { name: "asc" },
      take: 200,
    }),
  );
});

// Admin / Kitchen: Toggle dish availability (in stock / out of stock)
catalogRouter.patch("/:id/toggle", async (req, res) => {
  const food = await prisma.food.findUnique({
    where: { id: req.params.id },
  });
  if (!food) throw new HttpError(404, "Food item not found");

  const updated = await prisma.food.update({
    where: { id: food.id },
    data: { available: !food.available },
  });
  res.json(updated);
});

// Admin / Kitchen: Create new dish
catalogRouter.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(5).max(500),
    category: z.string().trim().min(2).max(50),
    price: z.number().int().min(100), // minimum ₹1 (100 paise)
    vegetarian: z.boolean().default(false),
    image: z.string().url().default("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"),
  });

  const data = schema.parse(req.body);
  const created = await prisma.food.create({ data });
  res.status(201).json(created);
});
