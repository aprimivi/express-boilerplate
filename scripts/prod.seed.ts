import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import bcrypt from "bcrypt";
import { connectDatabase, sequelize } from "../src/config/database";
import { User, UserRole } from "../src/models/user.model";

async function main() {
  await connectDatabase();

  // In production, we might want to be more careful about seeding
  // Only seed if the table is empty
  const userCount = await User.count();

  if (userCount === 0) {
    // Create initial admin user
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@express-boilerplate.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    console.log("Production seed completed:", adminUser);
  } else {
    console.log("Skipping production seed - data already exists");
  }
}

main()
  .catch((e) => {
    console.error("Error seeding production data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
