import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole, InventoryCategory } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// ============================================
// GET /api/inventory - Get all inventory items
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" }
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// ============================================
// POST /api/inventory - Create inventory item (Admin only)
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { name, category, quantity, price } = req.body;

      if (!name || !category || quantity === undefined || !price) {
        return res.status(400).json({ 
          message: "name, category, quantity, and price are required" 
        });
      }

      const item = await prisma.inventoryItem.create({
        data: { name, category, quantity, price }
      });

      res.status(201).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  }
);

// ============================================
// POST /api/inventory/sale - Record a sale
// ============================================
router.post(
  "/sale",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { itemId, quantity, paymentMethod } = req.body;

      if (!itemId || !quantity || quantity < 1) {
        return res.status(400).json({ 
          message: "itemId and valid quantity are required" 
        });
      }

      if (paymentMethod && !["CASH", "POS", "TRANSFER"].includes(paymentMethod)) {
        return res.status(400).json({ 
          message: "Invalid payment method. Use CASH, POS, or TRANSFER" 
        });
      }

      // Get the item
      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check stock
      if (item.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${item.quantity}` 
        });
      }

      // Check role permissions
      // DRINKS_SELLER can only sell drinks
      // FRONT_DESK can only sell condoms
      const userRole = req.user!.role;
      
      if (userRole === UserRole.DRINKS_SELLER && item.category !== InventoryCategory.DRINK) {
        return res.status(403).json({ 
          message: "Drinks sellers can only sell drinks" 
        });
      }

      if (userRole === UserRole.FRONT_DESK && item.category !== InventoryCategory.CONDOM) {
        return res.status(403).json({ 
          message: "Front desk can only sell condoms" 
        });
      }

      // Get or create today's business day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let businessDay = await prisma.businessDay.findUnique({
        where: { date: today }
      });

      if (!businessDay) {
        businessDay = await prisma.businessDay.create({
          data: { date: today }
        });
      }

      if (businessDay.isLocked) {
        return res.status(400).json({ 
          message: "Cannot record sale: Business day is locked" 
        });
      }

      // Create sale and update inventory in transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const newSale = await tx.sale.create({
          data: {
            itemId,
            quantity,
            totalPrice: item.price * quantity,
            paymentMethod: paymentMethod || "CASH",
            soldById: req.user!.id,
            businessDayId: businessDay.id,
          },
          include: {
            item: true,
            soldBy: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        // Reduce inventory
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: { decrement: quantity } }
        });

        return newSale;
      });

      res.status(201).json(sale);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to record sale" });
    }
  }
);

// ============================================
// GET /api/inventory/sales - Get all sales
// ============================================
router.get("/sales", requireAuth, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        item: true,
        soldBy: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

export default router;