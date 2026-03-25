import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// ============================================
// GET /api/reports/daily - Daily summary report
// ============================================
router.get(
  "/daily",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      // Get date from query params or use today
      const dateParam = req.query.date as string;
      const reportDate = dateParam ? new Date(dateParam) : new Date();
      reportDate.setHours(0, 0, 0, 0);

      // Get business day
      const businessDay = await prisma.businessDay.findUnique({
        where: { date: reportDate },
        include: {
          bookings: {
            include: {
              room: true,
              payment: true,
            }
          },
          sales: {
            include: {
              item: true,
            }
          },
          confirmedBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      if (!businessDay) {
        return res.json({
          date: reportDate,
          summary: {
            totalRevenue: 0,
            roomRevenue: 0,
            salesRevenue: 0,
            bookingsCount: 0,
            salesCount: 0,
          },
          paymentBreakdown: { CASH: 0, POS: 0, TRANSFER: 0 },
          salesByCategory: { DRINK: 0, CONDOM: 0 },
          bookings: [],
          sales: [],
          isLocked: false,
        });
      }

      // Calculate room revenue
      const roomRevenue = businessDay.bookings.reduce((sum, booking) => {
        return sum + booking.price;
      }, 0);

      // Calculate sales revenue
      const salesRevenue = businessDay.sales.reduce((sum, sale) => {
        return sum + sale.totalPrice;
      }, 0);

      // Payment breakdown (bookings + sales)
      const paymentBreakdown = {
        CASH: 0,
        POS: 0,
        TRANSFER: 0,
      };

      // Add booking payments
      businessDay.bookings.forEach(booking => {
        if (booking.payment) {
          const method = booking.payment.method;
          if (method === "CASH" || method === "POS" || method === "TRANSFER") {
            paymentBreakdown[method] += booking.payment.amount;
          }
        }
      });

      // Add sales payments
      businessDay.sales.forEach(sale => {
        const method = sale.paymentMethod;
        if (method === "CASH" || method === "POS" || method === "TRANSFER") {
          paymentBreakdown[method] += sale.totalPrice;
        }
      });

      // Sales by category
      const salesByCategory = {
        DRINK: 0,
        CONDOM: 0,
      };

      businessDay.sales.forEach(sale => {
        salesByCategory[sale.item.category] += sale.totalPrice;
      });

      // Prepare response
      const report = {
        date: reportDate,
        summary: {
          totalRevenue: roomRevenue + salesRevenue,
          roomRevenue,
          salesRevenue,
          bookingsCount: businessDay.bookings.length,
          salesCount: businessDay.sales.length,
        },
        paymentBreakdown,
        salesByCategory,
        bookings: businessDay.bookings,
        sales: businessDay.sales,
        isLocked: businessDay.isLocked,
        confirmedBy: businessDay.confirmedBy,
      };

      res.json(report);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  }
);

// ============================================
// POST /api/reports/lock-day - Lock business day
// ============================================
router.post(
  "/lock-day",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req: AuthRequest, res) => {
    try {
      const { date } = req.body;

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const lockDate = new Date(date);
      lockDate.setHours(0, 0, 0, 0);

      // Check if business day exists
      let businessDay = await prisma.businessDay.findUnique({
        where: { date: lockDate }
      });

      if (!businessDay) {
        return res.status(404).json({ message: "Business day not found" });
      }

      if (businessDay.isLocked) {
        return res.status(400).json({ message: "Business day is already locked" });
      }

      // Lock the day
      businessDay = await prisma.businessDay.update({
        where: { id: businessDay.id },
        data: {
          isLocked: true,
          confirmedById: req.user!.id,
        },
        include: {
          confirmedBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      res.json({
        message: "Business day locked successfully",
        businessDay,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to lock business day" });
    }
  }
);

export default router;