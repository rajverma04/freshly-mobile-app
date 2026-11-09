import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errors.js";
export const recipesRouter = Router();
recipesRouter.get("/", async (req, res) => {
  const { query, offset } = z
    .object({
      query: z.string().max(100).default(""),
      offset: z.coerce.number().int().min(0).max(900).default(0),
    })
    .parse(req.query);
  if (!env.SPOONACULAR_API_KEY)
    throw new HttpError(503, "Recipe discovery is not configured yet.");
  const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
  url.search = new URLSearchParams({
    query,
    offset: String(offset),
    number: "12",
    addRecipeInformation: "true",
  }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "x-api-key": env.SPOONACULAR_API_KEY },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new HttpError(502, "Recipe service is unavailable. Please retry.");
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 402 || response.status === 429 ? 503 : 502,
      "Recipe service is temporarily unavailable.",
    );
  const parsed = z
    .object({
      results: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          image: z.string().optional(),
          readyInMinutes: z.number().optional(),
          sourceUrl: z.string().optional(),
        }),
      ),
      totalResults: z.number(),
    })
    .safeParse(await response.json());
  if (!parsed.success)
    throw new HttpError(502, "Recipe service returned an unexpected response.");
  const data = parsed.data;
  res.json({
    results: data.results.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      sourceUrl: r.sourceUrl,
    })),
    totalResults: data.totalResults,
  });
});
