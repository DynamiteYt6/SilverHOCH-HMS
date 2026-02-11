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
// POST /api/rooms - Create room (Super Admin)
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { number, type, floor } = req.body;

      if (typeof number !== "number" || typeof floor !== "number" || !type) {
        return res.status(400).json({ message: "number, type, and floor are required" });
      }

      if (!["FAN", "AC"].includes(type)) {
        return res.status(400).json({ message: "Invalid room type" });
      }

      const room = await prisma.room.create({
        data: {
          number,
          type,
          floor,
          status: "AVAILABLE",
        },
      });

      res.status(201).json(room);
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(400).json({ message: "Room number already exists" });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create room" });
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