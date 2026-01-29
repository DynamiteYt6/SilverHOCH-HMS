import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { UserRole } from "@prisma/client";


export function requireRole(...allowedRoles: UserRole[]) {
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    
    // First check: Is the user even logged in?
    // req.user comes from the requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Second check: Does the user's role match any of the allowed roles?
    // .includes() checks if the array contains the user's role
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      // 403 = Forbidden (you're logged in, but you don't have permission)
      // 401 = Unauthorized (you're not logged in)
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    // If both checks pass, call next() to move to the next middleware/route handler
    next();
  };
}