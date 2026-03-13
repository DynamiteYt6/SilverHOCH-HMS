import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/hash.js";

const prisma = new PrismaClient();

async function main() {
  // ─────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────
  const users = [
    { name: "Dynamite", username: "dynamite", password: "admin123",       role: "SUPER_ADMIN"   as const },
    { name: "Choice",   username: "choice",   password: "choice4121",     role: "ADMIN"         as const },
    { name: "Silver",   username: "silver",   password: "kvngsilver123",  role: "FRONT_DESK"    as const },
    { name: "Pedro",    username: "pedro",    password: "lordpedro123",   role: "DRINKS_SELLER" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        username: u.username,
        password: await hashPassword(u.password),
        role: u.role,
      },
    });
    console.log(`✅ User: ${u.username} (${u.role})`);
  }

  // ─────────────────────────────────────────
  // ROOMS
  // ─────────────────────────────────────────
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      // Floor 1 — FAN
      { number: 101, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 102, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 103, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 104, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 105, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 106, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 107, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 108, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 109, type: "FAN", floor: 1, status: "AVAILABLE" },
      { number: 110, type: "FAN", floor: 1, status: "AVAILABLE" },
      // Floor 2 — AC
      { number: 201, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 202, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 203, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 204, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 205, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 206, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 207, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 208, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 209, type: "AC", floor: 2, status: "AVAILABLE" },
      { number: 210, type: "AC", floor: 2, status: "AVAILABLE" },
    ],
  });
  console.log("✅ 20 rooms created (101-110 FAN floor 1, 201-210 AC floor 2)");

  // ─────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────
  await prisma.inventoryItem.createMany({
    skipDuplicates: false,
    data: [
      { name: "Black Bullet",  category: "DRINK",  quantity: 100, price: 4000    },
      { name: "Chi-Exotic",    category: "DRINK",  quantity: 100, price: 3000    },
      { name: "Coke",          category: "DRINK",  quantity: 100, price: 600     },
      { name: "Fanta",         category: "DRINK",  quantity: 100, price: 600     },
      { name: "Four Cousins",  category: "DRINK",  quantity: 100, price: 40000   },
      { name: "Heineken",      category: "DRINK",  quantity: 100, price: 1200    },
      { name: "Hollandia",     category: "DRINK",  quantity: 100, price: 3000    },
      { name: "Lacoco",        category: "DRINK",  quantity: 100, price: 2500    },
      { name: "Pepsi",         category: "DRINK",  quantity: 100, price: 600     },
      { name: "Sprite",        category: "DRINK",  quantity: 100, price: 600     },
      { name: "VSOP",          category: "DRINK",  quantity: 100, price: 1000000 },
      { name: "Water",         category: "DRINK",  quantity: 100, price: 300     },
      { name: "Condom",        category: "CONDOM", quantity: 100, price: 1000    },
    ],
  });
  console.log("✅ 13 inventory items created (12 drinks + condom)");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Login credentials:");
  console.log("  dynamite / admin123       → Super Admin");
  console.log("  choice   / choice4121     → Admin");
  console.log("  silver   / kvngsilver123  → Front Desk");
  console.log("  pedro    / lordpedro123   → Drinks Seller");
  console.log("─────────────────────────────────────────");
  console.log("⚠️  Stock quantities are all 0 — update them in the app!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });