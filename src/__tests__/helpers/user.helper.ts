import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User, UserRole } from "@/models/user.model";

interface CreateTestUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
}

export const createTestUser = async (data: CreateTestUserInput = {}) => {
  const plainPassword = data.password || "Password123!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    email: data.email || `test-${uuidv4()}@example.com`,
    name: data.name || "Test User",
    password: hashedPassword,
    role: data.role || UserRole.USER,
  });

  return user.toJSON();
};
