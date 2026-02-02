import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { connectDatabase, sequelize } from "../src/config/database";

(async () => {
  try {
    await connectDatabase();
    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Failed to synchronize database", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
