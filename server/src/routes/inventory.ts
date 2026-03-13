import { Router } from "express";
import fs from "fs";
import path from "path";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads", "inventory");

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns which inventory category a role is allowed to SELL.
 * - DRINKS_SELLER  → DRINK only
 * - FRONT_DESK     → CONDOM only
 * - ADMIN / SUPER_ADMIN → both (no restriction)
 */
function getAllowedSaleCategory(role: string): "DRINK" | "CONDOM" | null {
  if (role === UserRole.DRINKS_SELLER) return "DRINK";
  if (role === UserRole.FRONT_DESK) return "CONDOM";
  return null; // admins have no restriction
}

// ============================================
// GET /api/inventory — Get inventory items
// Each role only sees the items they can sell.
// Admins see everything.
// ============================================
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const allowedCategory = getAllowedSaleCategory(role);

    const items = await prisma.inventoryItem.findMany({
      // Filter by category for selling roles; admins get all
      where: allowedCategory ? { category: allowedCategory } : undefined,
      orderBy: { name: "asc" },
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// ============================================
// POST /api/inventory — Create / restock item (Admin only)
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { name, category, quantity, price, imageUrl } = req.body;

      if (!name || !category || quantity === undefined || !price) {
        return res.status(400).json({
          message: "name, category, quantity, and price are required",
        });
      }

      if (!["DRINK", "CONDOM"].includes(category)) {
        return res.status(400).json({ message: "category must be DRINK or CONDOM" });
      }

      const item = await prisma.inventoryItem.create({
        data: { name, category, quantity, price, imageUrl },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  }
);

// ============================================
// POST /api/inventory/:id/image — Upload image (Admin only)
// ============================================
router.post(
  "/:id/image",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { imageData, fileName } = req.body;

      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({ message: "Image data is required" });
      }

      const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ message: "Invalid image data format" });
      }

      const item = await prisma.inventoryItem.findUnique({
        where: { id: req.params.id },
      });

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2] ?? "";
      const extensionFromMime = mimeType.split("/")[1] ?? "jpg";
      const providedExtension = fileName ? path.extname(fileName) : "";
      const safeExtension = (providedExtension || `.${extensionFromMime}`)
        .replace(/[^a-zA-Z0-9.]/g, "")
        .toLowerCase();

      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
      const imageBuffer = Buffer.from(base64Data, "base64");

      if (imageBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image must be 5MB or smaller" });
      }

      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, safeName), imageBuffer);

      const imageUrl = `/uploads/inventory/${safeName}`;

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { imageUrl },
      });

      res.status(200).json(updatedItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to upload inventory image" });
    }
  }
);

// ============================================
// POST /api/inventory/sale — Record a sale
//
// Rules:
//   DRINKS_SELLER  → can only sell DRINK items
//   FRONT_DESK     → can only sell CONDOM items
//   ADMIN / SUPER_ADMIN → can sell anything
// ============================================
router.post("/sale", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { itemId, quantity, paymentMethod } = req.body;
    const role = req.user!.role;

    // Basic validation
    if (!itemId || !quantity || Number(quantity) < 1) {
      return res.status(400).json({
        message: "itemId and a valid quantity (≥1) are required",
      });
    }

    if (!paymentMethod || !["CASH", "POS", "TRANSFER"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "paymentMethod must be CASH, POS, or TRANSFER",
      });
    }

    // Only selling roles + admins can call this endpoint
    const sellerRoles: string[] = [
      UserRole.DRINKS_SELLER,
      UserRole.FRONT_DESK,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];
    if (!sellerRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: You cannot record sales" });
    }

    // Fetch the item
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // ✅ Category enforcement — the core business rule
    const allowedCategory = getAllowedSaleCategory(role);
    if (allowedCategory && item.category !== allowedCategory) {
      const readable = allowedCategory === "DRINK" ? "drinks" : "condoms";
      return res.status(403).json({
        message: `Forbidden: Your role can only sell ${readable}`,
      });
    }

    // Stock check
    if (item.quantity < Number(quantity)) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${item.quantity}`,
      });
    }

    // Get or create today's business day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let businessDay = await prisma.businessDay.findUnique({ where: { date: today } });

    if (!businessDay) {
      businessDay = await prisma.businessDay.create({ data: { date: today } });
    }

    if (businessDay.isLocked) {
      return res.status(400).json({
        message: "Cannot record sale: Business day is locked",
      });
    }

    // Create sale + reduce stock in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          itemId,
          quantity: Number(quantity),
          totalPrice: item.price * Number(quantity),
          paymentMethod: paymentMethod,
          soldById: req.user!.id,
          businessDayId: businessDay.id,
        },
        include: {
          item: true,
          soldBy: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: { decrement: Number(quantity) } },
      });

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to record sale" });
  }
});

// ============================================
// GET /api/inventory/sales — Get sales history
// Admins see all; selling roles see only their own sales.
// ============================================
router.get("/sales", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;

    const sales = await prisma.sale.findMany({
      where: isAdmin
        ? undefined
        : { soldById: req.user!.id }, // sellers only see their own
      include: {
        item: true,
        soldBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

export default router;