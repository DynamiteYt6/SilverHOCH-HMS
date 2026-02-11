import prisma from "./lib/prisma.js";
import dotenv from "dotenv";
import app from "./app.js";


dotenv.config();

const PORT = process.env.PORT || 3000;

const ensureSchemaCompatibility = async () => {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT');
    console.log("✅ Schema compatibility checks passed");
  } catch (error) {
    console.error("⚠️ Failed to run schema compatibility checks:", error);
  }
};

const startServer = async () => {
  await ensureSchemaCompatibility();

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

startServer();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});
