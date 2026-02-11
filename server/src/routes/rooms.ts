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
// POST /api/rooms - Create room (Super Admin only)
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { number, type, floor } = req.body;

      if (number === undefined || !type || floor === undefined) {
        return res.status(400).json({ message: "number, type, and floor are required" });
      }

      const parsedNumber = Number(number);
      const parsedFloor = Number(floor);

      if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
        return res.status(400).json({ message: "Room number must be a positive integer" });
      }

      if (!Number.isInteger(parsedFloor) || parsedFloor < 0) {
        return res.status(400).json({ message: "Floor must be 0 or greater" });
      }

      if (!["FAN", "AC"].includes(type)) {
        return res.status(400).json({ message: "Invalid room type. Use FAN or AC" });
      }

      const existingRoom = await prisma.room.findUnique({
        where: { number: parsedNumber }
      });

      if (existingRoom) {
        return res.status(400).json({ message: "Room number already exists" });
      }

      const room = await prisma.room.create({
        data: {
          number: parsedNumber,
          type,
          floor: parsedFloor,
          status: "AVAILABLE"
        }
      });

      res.status(201).json(room);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create room" });
    }
  }
);


// ============================================
// DELETE /api/rooms/:id - Delete room (Super Admin only)
// ============================================
router.delete(
  "/:id",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const room = await prisma.room.findUnique({
        where: { id },
        include: {
          bookings: {
            where: { checkOut: null },
            select: { id: true }
          }
        }
      });

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.bookings.length > 0) {
        return res.status(400).json({ message: "Cannot delete room with active bookings" });
      }

      await prisma.room.delete({ where: { id } });
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete room" });
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