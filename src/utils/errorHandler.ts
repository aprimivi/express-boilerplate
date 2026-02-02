import { AppError } from "./appError";
import { logger } from "@/config/logger";
import { ErrorCode } from "./errorCodes";
import {
  ValidationError as SequelizeValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";

export class ErrorHandler {
  static handle(error: unknown, context: string) {
    // Handle Sequelize errors
    if (error instanceof UniqueConstraintError) {
      const dbError = error as UniqueConstraintError;
      const appError = new AppError(
        "Resource already exists",
        409,
        ErrorCode.ALREADY_EXISTS
      );
      logger.warn("Unique constraint violation", {
        message: appError.message,
        context,
        code: appError.code,
        statusCode: appError.statusCode,
        details: dbError.errors,
      });
      return appError;
    }

    if (error instanceof ForeignKeyConstraintError) {
      const dbError = error as ForeignKeyConstraintError;
      const appError = new AppError("Invalid reference", 400, ErrorCode.DB_ERROR);
      logger.warn("Foreign key constraint violation", {
        message: appError.message,
        context,
        code: appError.code,
        statusCode: appError.statusCode,
        details: dbError.fields,
      });
      return appError;
    }

    if (error instanceof SequelizeValidationError) {
      const dbError = error as SequelizeValidationError;
      const appError = new AppError("Validation failed", 400, ErrorCode.VALIDATION_ERROR);
      logger.warn("Sequelize validation error", {
        message: appError.message,
        context,
        code: appError.code,
        statusCode: appError.statusCode,
        details: dbError.errors,
      });
      return appError;
    }

    if (error instanceof AppError) {
      logger.warn("Application error occurred", {
        message: error.message,
        context,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
      });
      return error;
    }

    // Log unknown errors
    const unknownError = new AppError(
      "Internal server error",
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      false
    );

    logger.error("Unknown error occurred", {
      message: error instanceof Error ? error.message : "Unknown error",
      context,
      error: error instanceof Error ? error.stack : JSON.stringify(error),
      details: error instanceof Error ? error : undefined,
    });

    return unknownError;
  }

}

// Add more specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, ErrorCode.VALIDATION_ERROR);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, ErrorCode.DB_ERROR);
  }
}
