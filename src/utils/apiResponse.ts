import { Response } from "express";
import { z } from "zod";

export class ApiResponse {
  static success(res: Response, data: any = null, message: string = "Success"): void {
    res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message: string, statusCode: number = 400, code?: string): void {
    res.status(statusCode).json({
      success: false,
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack })
    });
  }
}

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional(),
    statusCode: z.number(),
  });
