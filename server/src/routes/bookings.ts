import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole, StayType, BookingSource, PaymentStatus, PaymentMethod, RoomStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { readAppSettings } from "./settings.js";

const router = Router();

// ============================================
// POST /api/bookings - Create a new booking
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK),
  async (req: AuthRequest, res) => {
    try {
      const { roomId, roomIds, stayType, paymentMethod, guestName, guestPhone, guestEmail, guestAddress, numberOfNights } = req.body;

      const requestedRoomIds = Array.isArray(roomIds)
        ? roomIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        : (typeof roomId === "string" && roomId.trim().length > 0 ? [roomId] : []);

      // Validation
      if (requestedRoomIds.length === 0 || !stayType || !paymentMethod) {
        return res.status(400).json({ 
          message: "roomId/roomIds, stayType, and paymentMethod are required" 
        });
      }

      const nights = stayType === StayType.OVERNIGHT
        ? Math.min(30, Math.max(1, Number(numberOfNights) || 1))
        : 1;

      const rooms = await prisma.room.findMany({
        where: { id: { in: requestedRoomIds } }
      });

      if (rooms.length !== requestedRoomIds.length) {
        return res.status(404).json({ message: "One or more selected rooms were not found" });
      }

      const unavailableRoom = rooms.find((room) => room.status !== RoomStatus.AVAILABLE);
      if (unavailableRoom) {
        return res.status(400).json({
          message: `Room ${unavailableRoom.number} is ${unavailableRoom.status}, not available for booking`,
        });
      }

      // Calculate price based on room type and stay type
      const settings = readAppSettings();
      const pricing = settings.pricing;
      const priceForRoom = (roomType: "FAN" | "AC") => {
        if (roomType === "FAN") {
          return stayType === StayType.OVERNIGHT ? pricing.fanOvernightPrice * nights : pricing.fanShortStayPrice;
        }
        return stayType === StayType.OVERNIGHT ? pricing.acOvernightPrice * nights : pricing.acShortStayPrice;
      };

      const bookingMetadata = {
        guestName: typeof guestName === "string" ? guestName.trim() : "",
        guestPhone: typeof guestPhone === "string" ? guestPhone.trim() : "",
        guestEmail: typeof guestEmail === "string" ? guestEmail.trim() : "",
        guestAddress: typeof guestAddress === "string" ? guestAddress.trim() : "",
        numberOfNights: nights,
      };
      const hasMetadata = Object.entries(bookingMetadata).some(([key, value]) => key === "numberOfNights" ? Number(value) > 1 : Boolean(value));

      // Calculate times
      const checkIn = new Date();
      let checkOut: Date | null = null;
      let shortStayEnd: Date | null = null;

      if (stayType === StayType.SHORT_STAY) {
        // Short stay = 90 minutes from now
        shortStayEnd = new Date(checkIn.getTime() + 90 * 60 * 1000);
      }
      // For overnight, checkOut is set when they actually check out

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

      // Check if business day is locked
      if (businessDay.isLocked) {
        return res.status(400).json({ 
          message: "Cannot create booking: Business day is locked" 
        });
      }

      // Create bookings with payments in a transaction
      const bookingIds = await prisma.$transaction(async (tx) => {
        const createdBookingIds: string[] = [];

        for (const room of rooms) {
          const roomPrice = priceForRoom(room.type);

          const newBooking = await tx.booking.create({
            data: {
              roomId: room.id,
              stayType,
              source: BookingSource.WALK_IN,
              checkIn,
              checkOut,
              shortStayEnd,
              price: roomPrice,
              createdById: req.user!.id,
              businessDayId: businessDay.id,
              note: hasMetadata ? JSON.stringify(bookingMetadata) : null,
            },
          });

          await tx.payment.create({
            data: {
              bookingId: newBooking.id,
              amount: roomPrice,
              method: paymentMethod,
              status: PaymentStatus.PENDING,
            }
          });

          await tx.room.update({
            where: { id: room.id },
            data: { status: RoomStatus.OCCUPIED }
          });

          createdBookingIds.push(newBooking.id);
        }

        return createdBookingIds;
      });

      // Fetch complete bookings with payment details
      const completeBookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: {
          room: true,
          payment: true,
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.status(201).json({
        message: `Created ${completeBookings.length} booking${completeBookings.length > 1 ? "s" : ""} successfully`,
        bookings: completeBookings,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  }
);

// ============================================
// GET /api/bookings - Get all bookings
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true,
        payment: true,
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ============================================
// GET /api/bookings/:id - Get single booking
// ============================================
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        payment: true,
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});

// ============================================
// PATCH /api/bookings/:id/checkout - Checkout
// ============================================
router.patch(
  "/:id/checkout",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRONT_DESK),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get the booking
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { room: true, payment: true }
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.checkOut) {
        return res.status(400).json({ message: "Booking already checked out" });
      }

      // Checkout in a transaction
      const updated = await prisma.$transaction(async (tx) => {
        // Update booking
        const updatedBooking = await tx.booking.update({
          where: { id },
          data: { checkOut: new Date() }
        });

        // Update room status to CLEANING
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: RoomStatus.CLEANING }
        });

        return updatedBooking;
      });

      // Fetch complete updated booking
      const completeBooking = await prisma.booking.findUnique({
        where: { id: updated.id },
        include: {
          room: true,
          payment: true,
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      res.json(completeBooking);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to checkout booking" });
    }
  }
);

export default router;