import prisma from "./lib/prisma.js";
import dotenv from "dotenv";
import app from "./app.js";


dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
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
