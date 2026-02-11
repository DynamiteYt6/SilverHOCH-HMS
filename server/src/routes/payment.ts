import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole, PaymentStatus } from "@prisma/client";

const router = Router();

// ============================================
// PATCH /api/payments/:id/status - Update payment status
// ============================================
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const { status } = req.body;

      // Validate status
      if (!status || !Object.values(PaymentStatus).includes(status)) {
        return res.status(400).json({ 
          message: "Valid payment status is required (PAID or PENDING)" 
        });
      }

      // Check if payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
        include: { booking: true }
      });

      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Update payment status
      const payment = await prisma.payment.update({
        where: { id },
        data: { status },
        include: {
          booking: {
            include: {
              room: true
            }
          }
        }
      });

      res.json(payment);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  }
);

// ============================================
// GET /api/payments - Get all payments
// ============================================
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK),
  async (req, res) => {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          booking: {
            include: {
              room: true,
              createdBy: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.json(payments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  }
);

export default router;