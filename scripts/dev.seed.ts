import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { seedUsers } from "../src/seeders/user.seeder";
import { connectDatabase, sequelize } from "../src/config/database";

async function main() {
  await connectDatabase();
  await seedUsers();

  console.log("Development seed completed");
}

main()
  .catch((e) => {
    console.error("Error seeding development data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
