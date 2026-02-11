import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { hashPassword } from "../lib/hash.js";
import { verifyPassword } from "../lib/hash.js";
import { UserRole } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// ============================================
// GET /api/users/me - Get current user profile
// ============================================
router.get(
  "/me",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  }
);

// ============================================
// PATCH /api/users/me - Update current user profile
// ============================================
router.patch(
  "/me",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { name, username, currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData: any = {};

      if (typeof name === "string" && name.trim()) {
        updateData.name = name.trim();
      }

      if (typeof username === "string" && username.trim() && username !== existingUser.username) {
        const conflict = await prisma.user.findUnique({ where: { username } });
        if (conflict) {
          return res.status(400).json({ message: "Username already exists" });
        }
        updateData.username = username.trim();
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const validCurrent = await verifyPassword(currentPassword, existingUser.password);
        if (!validCurrent) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        updateData.password = await hashPassword(newPassword);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

// ============================================
// GET /api/users - Get all users
// ============================================
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Don't send password!
        },
        orderBy: { createdAt: "desc" }
      });

      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

// ============================================
// POST /api/users - Create new user
// ============================================
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { name, username, password, role } = req.body;

      // Validation
      if (!name || !username || !password || !role) {
        return res.status(400).json({
          message: "name, username, password, and role are required"
        });
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be SUPER_ADMIN, ADMIN, FRONT_DESK, or DRINKS_SELLER"
        });
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Don't return password
        }
      });

      res.status(201).json(user);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

// ============================================
// PATCH /api/users/:id - Update user
// ============================================
router.patch(
  "/:id",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { name, role, isActive } = req.body;

      // Build update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (role) {
        if (!Object.values(UserRole).includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        updateData.role = role;
      }
      if (typeof isActive === "boolean") updateData.isActive = isActive;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        }
      });

      res.json(user);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

// ============================================
// PATCH /api/users/:id/password - Change password
// ============================================
router.patch(
  "/:id/password",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: "New password is required and must be at least 6 characters"
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      res.json({ message: "Password updated successfully" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update password" });
    }
  }
);

export default router;
