import "reflect-metadata";
import { Sequelize } from "sequelize-typescript";
import { ENV } from "@/config/env";
import { logger } from "@/config/logger";

export const sequelize = new Sequelize(ENV.MYSQL_DATABASE_URL, {
  dialect: "mysql",
  logging:
    ENV.NODE_ENV === "development"
      ? (msg: string) => logger.debug(msg, { scope: "sequelize" })
      : false,
  models: [__dirname + "/../models/**/*.model.{ts,js}"],
  define: {
    timestamps: true,
  },
});

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: ENV.NODE_ENV !== "production" });
    logger.info("Database connection established and models synchronized");
  } catch (error) {
    logger.error("Unable to connect to the database", { error });
    throw error;
  }
};

export default sequelize;
