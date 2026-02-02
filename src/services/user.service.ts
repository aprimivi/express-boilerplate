import { AppError } from "@/utils/appError";
import { User, UserRole } from "@/models/user.model";

export class UserService {
  async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.findAll({
      limit,
      offset: skip,
      attributes: ["id", "name", "email", "role", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    return users.map((user) => user.toJSON());
  }

  async getUserById(id: string) {
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email", "role", "createdAt", "updatedAt"],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user.toJSON();
  }

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      role: "ADMIN" | "USER";
    }>
  ) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await user.update({
      name: data.name ?? user.name,
      email: data.email ?? user.email,
      role: (data.role as UserRole | undefined) ?? user.role,
    });

    return user.toJSON();
  }

  async deleteUser(id: string) {
    const deleted = await User.destroy({ where: { id } });

    if (!deleted) {
      throw new AppError("User not found", 404);
    }
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
  }) {
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: (data.role as UserRole | undefined) ?? UserRole.USER,
    });

    return user.toJSON();
  }
}
