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
    CORS_ORIGINS: z.string().default("http://localhost:8081"),
  })
  .parse(process.env);
