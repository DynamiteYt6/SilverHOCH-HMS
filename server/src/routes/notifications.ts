import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const [pendingPayments, lowStock, activeBookings] = await Promise.all([
      prisma.payment.findMany({
        where: { status: "PENDING" },
        include: { booking: { include: { room: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.inventoryItem.findMany({
        where: { quantity: { lte: 5 } },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.booking.findMany({
        where: { checkOut: null },
        include: { room: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const notifications = [
      ...pendingPayments.map((payment) => ({
        id: `pending-${payment.id}`,
        type: "PAYMENT_PENDING",
        title: "Pending payment",
        message: `Room ${payment.booking.room.number} has a pending payment of ₦${payment.amount.toLocaleString()}`,
        createdAt: payment.createdAt,
      })),
      ...lowStock.map((item) => ({
        id: `stock-${item.id}`,
        type: "LOW_STOCK",
        title: "Low stock alert",
        message: `${item.name} is low (${item.quantity} left)` ,
        createdAt: item.createdAt,
      })),
      ...activeBookings.map((booking) => ({
        id: `active-${booking.id}`,
        type: "ACTIVE_BOOKING",
        title: "Active stay",
        message: `Room ${booking.room.number} is currently occupied`,
        createdAt: booking.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    res.json({ notifications, unreadCount: notifications.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
