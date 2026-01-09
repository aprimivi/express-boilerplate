import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { AuthService } from "@/services/auth.service";
import { validateRequest } from "@/middleware/validateRequest";
import { loginSchema, signupSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from "@/validators/auth.validator";
import { requireAuth } from "@/middleware/authMiddleware";
import { verificationLimiter } from "@/middleware/rateLimiter";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createApiResponse } from "@/docs/openAPIResponseBuilders";
import { createUserSchema } from "@/validators/user.validator";

export const authRegistry = new OpenAPIRegistry();
const router = Router();

// Initialize services and controller
const authService = new AuthService();
const authController = new AuthController(authService);

// Routes
authRegistry.register("Auth", signupSchema);

authRegistry.registerPath({
  method: "post",
  path: "/auth/signup",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        'application/json': {
          schema: signupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.null(), "Success"),
});
router.post("/signup", validateRequest(signupSchema), authController.signup);

authRegistry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(createUserSchema.shape.body, "Success"),
});
router.post("/login", validateRequest(loginSchema), authController.login);

authRegistry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshTokenSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.null({}), "Success")
});
router.post("/refresh", authController.refresh);

authRegistry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  responses: createApiResponse(z.null({}), "Success"),
});
router.post("/logout", requireAuth, authController.logout);

authRegistry.registerPath({
  method: "get",
  path: "/auth/verify-email/:token",
  tags: ["Auth"],
  request: { params: verifyEmailSchema.shape.params },
  responses: createApiResponse(z.null({}), "Success")
});
router.get("/verify-email/:token", validateRequest(verifyEmailSchema), authController.verifyEmail);

/**
 * @swagger
 * /auth/send-email-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       429:
 *         description: Too many requests
 */
router.post(
  "/send-email-verification",
  verificationLimiter,
  validateRequest(resendVerificationSchema),
  authController.resendVerification
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if email exists
 */
router.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 *       404:
 *         description: Token not found
 */
router.post("/reset-password/:token", validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
