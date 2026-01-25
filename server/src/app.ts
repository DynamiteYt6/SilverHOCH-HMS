import express from "express";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import type { AuthRequest } from "./middleware/auth.js";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/protected", requireAuth, (req: AuthRequest, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});

export default app;
