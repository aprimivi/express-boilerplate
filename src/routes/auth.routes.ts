import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { AuthService } from "@/services/auth.service";
import { validateRequest } from "@/middleware/validateRequest";
import {
  loginSchema,
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "@/validators/auth.validator";
import { requireAuth } from "@/middleware/authMiddleware";
import { verificationLimiter } from "@/middleware/rateLimiter";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerRoute } from "@/docs/openAPIHelpers";
import { createUserSchema } from "@/validators/user.validator";

// ─── OpenAPI Registry ────────────────────────────────────────────────
export const authRegistry = new OpenAPIRegistry();

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/signup",
  tags: ["Auth"],
  summary: "Register a new user",
  requestBody: signupSchema.shape.body,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login user",
  requestBody: loginSchema.shape.body,
  responseSchema: createUserSchema.shape.body,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  requestBody: refreshTokenSchema.shape.body,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout user",
  security: true,
});

registerRoute(authRegistry, {
  method: "get",
  path: "/auth/verify-email/{token}",
  tags: ["Auth"],
  summary: "Verify email with token",
  params: verifyEmailSchema.shape.params,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/send-email-verification",
  tags: ["Auth"],
  summary: "Resend verification email",
  requestBody: resendVerificationSchema.shape.body,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Request password reset",
  requestBody: forgotPasswordSchema.shape.body,
});

registerRoute(authRegistry, {
  method: "post",
  path: "/auth/reset-password/{token}",
  tags: ["Auth"],
  summary: "Reset password with token",
  params: resetPasswordSchema.shape.params,
  requestBody: resetPasswordSchema.shape.body,
});

// ─── Router ──────────────────────────────────────────────────────────
const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/signup", validateRequest(signupSchema), authController.signup);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", requireAuth, authController.logout);
router.get("/verify-email/:token", validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post("/send-email-verification", verificationLimiter, validateRequest(resendVerificationSchema), authController.resendVerification);
router.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password/:token", validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
