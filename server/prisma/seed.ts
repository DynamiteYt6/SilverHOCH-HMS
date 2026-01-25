import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/hash.js"; // Add .js here

const prisma = new PrismaClient();

async function main() {
  // 1. Create admin user
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Super Admin",
      username: "admin",
      password: await hashPassword("admin123"),
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Admin user created:", admin.username);

  // 2. Create rooms
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      { number: 101, type: "FAN", floor: 1 },
      { number: 102, type: "AC", floor: 1 },
      { number: 201, type: "AC", floor: 2 },
    ],
  });

  console.log("✅ Rooms created");
  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });