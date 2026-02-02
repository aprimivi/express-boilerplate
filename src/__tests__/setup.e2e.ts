import request from "supertest";
import app from "@/app";
import { connectDatabase, sequelize } from "@/config/database";
import { User } from "@/models/user.model";

beforeAll(async () => {
  await connectDatabase();
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
  await sequelize.close();
});

export const testApp = request(app);
export { sequelize as database };
