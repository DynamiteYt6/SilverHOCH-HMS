import express from "express";
import cors from "cors";  
import path from "path";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import bookingRoutes from "./routes/bookings.js";
import inventoryRoutes from "./routes/inventory.js";
import reportRoutes from "./routes/reports.js";
import userRoutes from "./routes/users.js";
import settingsRoutes from "./routes/settings.js";
import notificationRoutes from "./routes/notifications.js";
import { requireAuth } from "./middleware/auth.js";
import type { AuthRequest } from "./middleware/auth.js";

const app = express();

app.use(cors());  
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);

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
