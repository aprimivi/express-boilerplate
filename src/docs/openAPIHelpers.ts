import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createApiResponse } from "@/docs/openAPIResponseBuilders";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface RouteDocConfig {
  method: HttpMethod;
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  requestBody?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  responseDescription?: string;
  statusCode?: number;
  security?: boolean;
}

/**
 * Helper to register an OpenAPI path with reduced boilerplate.
 *
 * Usage:
 * ```ts
 * registerRoute(registry, {
 *   method: "post",
 *   path: "/auth/login",
 *   tags: ["Auth"],
 *   summary: "Login user",
 *   requestBody: loginSchema.shape.body,
 *   responseSchema: createUserSchema.shape.body,
 * });
 * ```
 */
export function registerRoute(registry: OpenAPIRegistry, config: RouteDocConfig): void {
  const {
    method,
    path,
    tags,
    summary,
    description,
    requestBody,
    params,
    query,
    responseSchema = z.null(),
    responseDescription = "Success",
    statusCode = 200,
    security,
  } = config;

  const request: Record<string, unknown> = {};

  if (requestBody) {
    request.body = {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    };
  }

  if (params) {
    request.params = params;
  }

  if (query) {
    request.query = query;
  }

  registry.registerPath({
    method,
    path,
    tags,
    ...(summary && { summary }),
    ...(description && { description }),
    ...(Object.keys(request).length > 0 && { request }),
    ...(security && {
      security: [{ bearerAuth: [] }],
    }),
    responses: createApiResponse(responseSchema, responseDescription, statusCode),
  });
}
