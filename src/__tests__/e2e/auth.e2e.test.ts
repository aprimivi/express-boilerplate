import { testApp } from "../setup.e2e";
import bcrypt from "bcrypt";
import { User, UserRole } from "@/models/user.model";

describe("Auth endpoints", () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const response = await testApp.post("/api/auth/signup").send({
        email: "test@example.com",
        name: "Test User",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("id");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);

      await User.create({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: null,
        refreshToken: null,
      });
    });

    it("should login successfully", async () => {
      const response = await testApp.post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("accessToken");
    });
  });

  describe("Email verification", () => {
    it("should verify email with valid token", async () => {
      const user = await User.create({
        email: "test@example.com",
        name: "Test User",
        password: await bcrypt.hash("Password123!", 10),
        emailVerificationToken: "test-token",
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const response = await testApp
        .get("/api/auth/verify-email/test-token")
        .expect(200);

      expect(response.body.success).toBe(true);

      const verifiedUser = await User.findByPk(user.id);
      expect(verifiedUser?.emailVerified).toBeTruthy();
    });
  });

  describe("Password Reset", () => {
    it("should send password reset email", async () => {
      const user = await User.create({
        email: "test@example.com",
        name: "Test User",
        password: await bcrypt.hash("Password123!", 10),
        emailVerified: new Date(),
      });

      const response = await testApp
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.passwordResetToken).toBeTruthy();
      expect(updatedUser?.passwordResetExpires).toBeTruthy();
    });

    it("should reset password with valid token", async () => {
      const resetToken = "test-reset-token";
      const user = await User.create({
        email: "test@example.com",
        name: "Test User",
        password: await bcrypt.hash("OldPassword123!", 10),
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000),
        emailVerified: new Date(),
      });

      const response = await testApp
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: "NewPassword123!" })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.passwordResetToken).toBeNull();
      expect(updatedUser?.passwordResetExpires).toBeNull();

      const loginResponse = await testApp
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "NewPassword123!",
        })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeTruthy();
    });

    it("should not reset password with expired token", async () => {
      await User.create({
        email: "test@example.com",
        name: "Test User",
        password: await bcrypt.hash("Password123!", 10),
        passwordResetToken: "expired-token",
        passwordResetExpires: new Date(Date.now() - 3600000),
        emailVerified: new Date(),
      });

      const response = await testApp
        .post("/api/auth/reset-password/expired-token")
        .send({ password: "NewPassword123!" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ERR_1004");
    });
  });
});
