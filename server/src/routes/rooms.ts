import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole } from "@prisma/client";

const router = Router();

// ============================================
// GET /api/rooms - Get all rooms
// ============================================
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK), 
  async (req, res) => {
    try {
      const rooms = await prisma.room.findMany({
        orderBy: [
          { floor: "asc" },
          { number: "asc" }
        ],
      });
      
      res.json(rooms);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  }
);

// ============================================
// GET /api/rooms/:id - Get single room
// ============================================
router.get(
  "/:id",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK), 
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const room = await prisma.room.findUnique({
        where: { id },
      });

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  }
);

// ============================================
// PATCH /api/rooms/:id/status - Update room status
// ============================================
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const room = await prisma.room.update({
        where: { id },
        data: { status },
      });

      res.json(room);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update room status" });
    }
  }
);

export default router;