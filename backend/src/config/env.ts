import "dotenv/config";
import { z } from "zod";
export const env = z
  .object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    SPOONACULAR_API_KEY: z.string().optional(),
    SPOONACULAR_DAILY_REQUEST_LIMIT: z.coerce.number().int().min(1).max(49).default(45),
    CORS_ORIGINS: z.string().default("http://localhost:8081"),
  })
  .parse(process.env);
