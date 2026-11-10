import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";
export const recipesRouter = Router();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const responseSchema = z.object({results:z.array(z.object({id:z.number(),title:z.string(),image:z.string().optional(),readyInMinutes:z.number().optional(),sourceUrl:z.string().optional()})),totalResults:z.number()});
recipesRouter.get("/", async (req,res)=>{
 const {query,offset}=z.object({query:z.string().max(100).default(""),offset:z.coerce.number().int().min(0).max(900).default(0)}).parse(req.query);
 const normalizedQuery=query.trim().toLocaleLowerCase("en-US");
 const cacheKey=createHash("sha256").update(JSON.stringify({query:normalizedQuery,offset,number:12})).digest("hex");
 const cached=await prisma.recipeSearchCache.findUnique({where:{cacheKey}});
 if(cached&&cached.expiresAt>new Date()){res.setHeader("X-Recipe-Cache","HIT");res.json({results:cached.results,totalResults:cached.totalResults});return;}
 if(!env.SPOONACULAR_API_KEY){if(cached){res.setHeader("X-Recipe-Cache","STALE");res.json({results:cached.results,totalResults:cached.totalResults});return;}throw new HttpError(503,"Recipe discovery is not configured yet.");}
 const url=new URL("https://api.spoonacular.com/recipes/complexSearch");url.search=new URLSearchParams({query:normalizedQuery,offset:String(offset),number:"12",addRecipeInformation:"true"}).toString();
 let response:Response;
 try{response=await fetch(url,{headers:{"x-api-key":env.SPOONACULAR_API_KEY},signal:AbortSignal.timeout(10000)});}catch{if(cached){res.setHeader("X-Recipe-Cache","STALE");res.json({results:cached.results,totalResults:cached.totalResults});return;}throw new HttpError(502,"Recipe service is unavailable. Please retry.");}
 if(!response.ok){if(cached&&(response.status===402||response.status===429||response.status>=500)){res.setHeader("X-Recipe-Cache","STALE");res.json({results:cached.results,totalResults:cached.totalResults});return;}throw new HttpError(response.status===402||response.status===429?503:502,"Recipe service is temporarily unavailable.");}
 const parsed=responseSchema.safeParse(await response.json());if(!parsed.success)throw new HttpError(502,"Recipe service returned an unexpected response.");
 const data=parsed.data;const cacheData={query:normalizedQuery,offset,totalResults:data.totalResults,results:data.results,fetchedAt:new Date(),expiresAt:new Date(Date.now()+CACHE_TTL_MS)};
 await prisma.recipeSearchCache.upsert({where:{cacheKey},create:{cacheKey,...cacheData},update:cacheData});res.setHeader("X-Recipe-Cache","MISS");res.json(data);
});
