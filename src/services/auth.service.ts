import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "@/config/env";
import { AppError } from "@/utils/appError";
import { logger } from "@/config/logger";
import { ErrorCode } from "@/utils/errorCodes";
import crypto from "crypto";
import { EmailService } from "./email.service";
import { User, UserRole } from "@/models/user.model";
import { Op } from "sequelize";

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  private toSafeUser(user: User) {
    const plain = user.get({ plain: true });
    return {
      id: plain.id,
      email: plain.email,
      name: plain.name,
      role: plain.role,
    };
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async signup(email: string, name: string, password: string) {
    const existingUser = await User.findOne({ where: { email }, raw: true });
    if (existingUser) {
      throw new AppError("Email already exists", 400, ErrorCode.ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, name, verificationToken);

    return this.toSafeUser(user);
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [Op.gt]: new Date(),
        },
        emailVerified: null,
      },
    });

    if (!user) {
      throw new AppError(
        "Invalid or expired verification token",
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    await user.update({
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return { message: "Email verified successfully" };
  }

  private async cleanupExpiredTokens() {
    await User.update(
      {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      {
        where: {
          emailVerificationExpires: {
            [Op.lt]: new Date(),
          },
          emailVerified: null,
        },
      }
    );
  }

  async resendVerificationEmail(email: string) {
    // Clean up expired tokens first
    await this.cleanupExpiredTokens();

    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    if (user.emailVerified) {
      throw new AppError(
        "Email is already verified",
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    const verificationToken = this.generateVerificationToken();
    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    return { message: "Verification email sent" };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      throw new AppError(
        "Invalid credentials",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email before logging in",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid credentials",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token in database
    await user.update({ refreshToken });

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError(
        "Refresh token is required",
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET) as {
        userId: string;
      };

      logger.debug("Processing refresh token request", {
        userId: decoded.userId,
        context: "AuthService.refresh",
      });

      const user = await User.findOne({
        where: {
          id: decoded.userId,
          refreshToken: refreshToken,
        },
      });

      if (!user) {
        throw new AppError(
          "Invalid refresh token",
          401,
          ErrorCode.INVALID_TOKEN
        );
      }

      const accessToken = this.generateAccessToken(user.id, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      await user.update({ refreshToken: newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: this.toSafeUser(user),
      };
    } catch (error) {
      logger.error("Refresh token error", {
        error,
        context: "AuthService.refresh",
      });
      throw new AppError("Invalid refresh token", 401, ErrorCode.INVALID_TOKEN);
    }
  }

  async logout(userId: string) {
    if (!userId) {
      throw new AppError("User ID is required", 400, ErrorCode.INVALID_INPUT);
    }

    try {
      await User.update({ refreshToken: null }, { where: { id: userId } });
    } catch (error) {
      logger.error("Logout error", {
        error,
        userId,
        context: "AuthService.logout",
      });
      throw new AppError(
        "Failed to logout",
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRY,
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, {
      expiresIn: ENV.REFRESH_TOKEN_EXPIRY,
    });
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    const resetToken = this.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken
      );
      return { message: "Password reset email sent" };
    } catch (error) {
      // If email fails, clear the reset token
      await user.update({
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError(
        "Invalid or expired reset token",
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: "Password reset successfully" };
  }
}
