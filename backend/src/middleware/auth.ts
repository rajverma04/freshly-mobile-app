import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
export const authenticated: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ message: "Please sign in." });
    return;
  }
  next();
};
