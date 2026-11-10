import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { HttpError } from "./errors.js";

export type AppRole = "user" | "staff" | "admin";

export const authenticated: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ message: "Please sign in." });
    return;
  }
  next();
};

export function requireRole(...allowedRoles: AppRole[]): RequestHandler {
  return async (req, _res, next) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) throw new HttpError(401, "Please sign in.");
      const user = await clerkClient.users.getUser(userId);
      const rawRole = user.publicMetadata.role;
      const role: AppRole = rawRole === "admin" || rawRole === "staff" ? rawRole : "user";
      if (!allowedRoles.includes(role)) throw new HttpError(403, "You do not have permission to perform this action.");
      next();
    } catch (error) {
      next(error);
    }
  };
}
