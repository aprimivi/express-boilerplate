import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { UserService } from "@/services/user.service";
import { validateRequest } from "@/middleware/validateRequest";
import { requireAuth, requireRole } from "@/middleware/authMiddleware";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
} from "@/validators/user.validator";
import { cache } from "@/middleware/cacheMiddleware";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerRoute } from "@/docs/openAPIHelpers";

// ─── OpenAPI Registry ────────────────────────────────────────────────
export const userRegistry = new OpenAPIRegistry();

const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

registerRoute(userRegistry, {
  method: "get",
  path: "/users",
  tags: ["Users"],
  summary: "Get all users (Admin only)",
  security: true,
  responseSchema: z.array(UserResponseSchema),
});

registerRoute(userRegistry, {
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Get user by ID",
  security: true,
  params: getUserSchema.shape.params,
  responseSchema: UserResponseSchema,
});

registerRoute(userRegistry, {
  method: "post",
  path: "/users",
  tags: ["Users"],
  summary: "Create new user (Admin only)",
  security: true,
  requestBody: createUserSchema.shape.body,
  statusCode: 201,
  responseDescription: "User created",
});

registerRoute(userRegistry, {
  method: "patch",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Update user (Admin only)",
  security: true,
  params: updateUserSchema.shape.params,
  requestBody: updateUserSchema.shape.body,
  responseDescription: "User updated",
});

registerRoute(userRegistry, {
  method: "delete",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Delete user (Admin only)",
  security: true,
  params: getUserSchema.shape.params,
  responseDescription: "User deleted",
});

// ─── Router ──────────────────────────────────────────────────────────
const router = Router();

const userService = new UserService();
const userController = new UserController(userService);

// All routes require authentication
router.use(requireAuth);

router.get("/", requireRole(["ADMIN"]), cache({ duration: 300 }), userController.getAll);
router.get("/:id", cache({ duration: 60 }), userController.getUser);
router.post("/", requireRole(["ADMIN"]), validateRequest(createUserSchema), userController.create);
router.patch("/:id", requireRole(["ADMIN"]), validateRequest(updateUserSchema), userController.update);
router.delete("/:id", requireRole(["ADMIN"]), userController.delete);

export default router;
