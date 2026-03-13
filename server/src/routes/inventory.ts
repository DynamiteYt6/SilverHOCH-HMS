import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";

const router = Router();

function getAllowedSaleCategory(role: string): "DRINK" | "CONDOM" | null {
  if (role === UserRole.DRINKS_SELLER) return "DRINK";
  if (role === UserRole.FRONT_DESK) return "CONDOM";
  return null;
}

// GET /api/inventory
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const allowedCategory = getAllowedSaleCategory(role);
    const items = await prisma.inventoryItem.findMany({
      ...(allowedCategory ? { where: { category: allowedCategory } } : {}),
      orderBy: { name: "asc" },
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// POST /api/inventory
router.post("/", requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (req, res) => {
  try {
    const { name, category, quantity, price, imageUrl } = req.body;
    if (!name || !category || quantity === undefined || !price) {
      return res.status(400).json({ message: "name, category, quantity, and price are required" });
    }
    const item = await prisma.inventoryItem.create({
      data: { name, category, quantity, price, imageUrl },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create inventory item" });
  }
});

// PUT /api/inventory/:id
router.put("/:id", requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (req, res) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!id) return res.status(400).json({ message: "Invalid item ID" });
    const { name, category, quantity, price } = req.body;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { name, category, quantity, price },
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (req, res) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!id) return res.status(400).json({ message: "Invalid item ID" });

    // Clean up Cloudinary image if exists
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (item?.imageUrl) {
      await deleteFromCloudinary(item.imageUrl);
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete inventory item" });
  }
});

// POST /api/inventory/:id/image — now uploads to Cloudinary
router.post("/:id/image", requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!id) return res.status(400).json({ message: "Invalid item ID" });

    const { imageData } = req.body;
    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ message: "Image data is required" });
    }

    // Validate it's a proper base64 image
    if (!imageData.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,/)) {
      return res.status(400).json({ message: "Invalid image data format" });
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Delete old Cloudinary image if replacing
    if (item.imageUrl && item.imageUrl.includes("cloudinary.com")) {
      await deleteFromCloudinary(item.imageUrl);
    }

    // Upload to Cloudinary — returns a permanent URL
    const imageUrl = await uploadToCloudinary(imageData);

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: { imageUrl },
    });

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload inventory image" });
  }
});

// POST /api/inventory/sale
router.post(
  "/sale",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.DRINKS_SELLER),
  async (req: AuthRequest, res) => {
    try {
      const { itemId, quantity, paymentMethod } = req.body;
      if (!itemId || !quantity || quantity < 1) {
        return res.status(400).json({ message: "itemId and valid quantity are required" });
      }
      if (paymentMethod && !["CASH", "POS", "TRANSFER"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method. Use CASH, POS, or TRANSFER" });
      }

      const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) return res.status(404).json({ message: "Item not found" });

      const allowedCategory = getAllowedSaleCategory(req.user!.role);
      if (allowedCategory && item.category !== allowedCategory) {
        return res.status(403).json({ message: `Your role can only sell ${allowedCategory} items` });
      }

      if (item.quantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock. Available: ${item.quantity}` });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let businessDay = await prisma.businessDay.findUnique({ where: { date: today } });
      if (!businessDay) {
        businessDay = await prisma.businessDay.create({ data: { date: today } });
      }
      if (businessDay.isLocked) {
        return res.status(400).json({ message: "Cannot record sale: Business day is locked" });
      }

      const sale = await prisma.$transaction(async (tx) => {
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
            soldBy: { select: { id: true, name: true, role: true } },
          },
        });
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: { decrement: quantity } },
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

// GET /api/inventory/sales
router.get(
  "/sales",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.DRINKS_SELLER),
  async (req: AuthRequest, res) => {
    try {
      const role = req.user!.role;
      const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
      const sales = await prisma.sale.findMany({
        ...(isAdmin ? {} : { where: { soldById: req.user!.id } }),
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
  }
);

export default router;