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

      const inventoryItems = await prisma.inventoryItem.findMany({
        orderBy: { name: "asc" },
      });

      if (!businessDay) {
        const inventorySummary = {
          totalItems: inventoryItems.length,
          totalUnitsLeft: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
          lowStockCount: inventoryItems.filter((item) => item.quantity <= 10).length,
          criticalStockCount: inventoryItems.filter((item) => item.quantity <= 5).length,
        };

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
          inventorySummary,
          topSellingItems: [],
          lowStockItems: inventoryItems
            .filter((item) => item.quantity <= 10)
            .map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              stockLeft: item.quantity,
              price: item.price,
            })),
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

      const topSellingMap = new Map<
        string,
        { id: string; name: string; category: "DRINK" | "CONDOM"; unitsSold: number; revenue: number; stockLeft: number }
      >();

      businessDay.sales.forEach((sale) => {
        const key = sale.itemId;
        const existing = topSellingMap.get(key);
        if (existing) {
          existing.unitsSold += sale.quantity;
          existing.revenue += sale.totalPrice;
          existing.stockLeft = sale.item.quantity;
        } else {
          topSellingMap.set(key, {
            id: sale.item.id,
            name: sale.item.name,
            category: sale.item.category,
            unitsSold: sale.quantity,
            revenue: sale.totalPrice,
            stockLeft: sale.item.quantity,
          });
        }
      });

      const topSellingItems = Array.from(topSellingMap.values())
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5);

      const inventorySummary = {
        totalItems: inventoryItems.length,
        totalUnitsLeft: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
        lowStockCount: inventoryItems.filter((item) => item.quantity <= 10).length,
        criticalStockCount: inventoryItems.filter((item) => item.quantity <= 5).length,
      };

      const lowStockItems = inventoryItems
        .filter((item) => item.quantity <= 10)
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          stockLeft: item.quantity,
          price: item.price,
        }));

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
        inventorySummary,
        topSellingItems,
        lowStockItems,
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
