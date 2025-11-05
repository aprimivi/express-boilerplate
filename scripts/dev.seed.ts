import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { seedUsers } from "../src/seeders/user.seeder";

async function main() {
  await seedUsers(prisma);

  console.log("Development seed completed");
}

main()
  .catch((e) => {
    console.error("Error seeding development data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
