import { Router } from "express";
import prisma from "../lib/prisma.js";
import { verifyPassword } from "../lib/hash.js";
import { signToken } from "../lib/jwt.js";
const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
});

export default router;
