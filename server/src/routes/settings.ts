import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { UserRole } from "@prisma/client";

const router = Router();
const settingsFilePath = path.join(process.cwd(), "data", "app-settings.json");

interface AppSettings {
  hotel: {
    hotelName: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    checkInTime: string;
    checkOutTime: string;
    currency: string;
    taxRate: string;
  };
  pricing: {
    fanOvernightPrice: number;
    fanShortStayPrice: number;
    acOvernightPrice: number;
    acShortStayPrice: number;
  };
}

const defaultSettings: AppSettings = {
  hotel: {
    hotelName: "Silver HOCH Hotel",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    currency: "NGN",
    taxRate: "7.5",
  },
  pricing: {
    fanOvernightPrice: 10000,
    fanShortStayPrice: 4000,
    acOvernightPrice: 20000,
    acShortStayPrice: 10000,
  },
};

export function readAppSettings(): AppSettings {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const content = fs.readFileSync(settingsFilePath, "utf8");
    const parsed = JSON.parse(content) as Partial<AppSettings>;
    return {
      hotel: { ...defaultSettings.hotel, ...(parsed.hotel || {}) },
      pricing: { ...defaultSettings.pricing, ...(parsed.pricing || {}) },
    };
  } catch (error) {
    console.error("Failed to read settings file:", error);
    return defaultSettings;
  }
}

function saveAppSettings(settings: AppSettings) {
  fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
}

router.get("/", requireAuth, (req, res) => {
  try {
    const settings = readAppSettings();
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.patch(
  "/",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  (req, res) => {
    try {
      const current = readAppSettings();
      const nextSettings: AppSettings = {
        hotel: { ...current.hotel, ...(req.body.hotel || {}) },
        pricing: {
          ...current.pricing,
          ...(req.body.pricing || {}),
          fanOvernightPrice: Number(req.body?.pricing?.fanOvernightPrice ?? current.pricing.fanOvernightPrice),
          fanShortStayPrice: Number(req.body?.pricing?.fanShortStayPrice ?? current.pricing.fanShortStayPrice),
          acOvernightPrice: Number(req.body?.pricing?.acOvernightPrice ?? current.pricing.acOvernightPrice),
          acShortStayPrice: Number(req.body?.pricing?.acShortStayPrice ?? current.pricing.acShortStayPrice),
        },
      };
      saveAppSettings(nextSettings);
      res.json(nextSettings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  }
);

export default router;
