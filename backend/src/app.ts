import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { recipesRouter } from "./modules/recipes/recipes.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { errors } from "./middleware/errors.js";
export const app = express();
app.use(
  helmet(),
  cors({ origin: env.CORS_ORIGINS.split(",") }),
  express.json({ limit: "32kb" }),
);
app.use(
  rateLimit({
    windowMs: 60000,
    limit: 1000,
    message: { message: "Too many requests. Please try again in a moment." },
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(clerkMiddleware());
app.use("/api/foods", catalogRouter);
app.use(
  "/api/recipes",
  rateLimit({
    windowMs: 60000,
    limit: 100,
    message: { message: "Too many recipe requests. Please try again in a moment." },
  }),
  recipesRouter,
);
app.use("/api/orders", ordersRouter);
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errors);
