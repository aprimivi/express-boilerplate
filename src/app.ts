import express from "express";
import { ENV } from "@/config/env";
import userRoutes from "@/routes/user.routes";
import authRoutes from "@/routes/auth.routes";
import { errorHandler } from "@/middleware/errorHandler";
import { setupSecurityHeaders } from "@/middleware/securityHeaders";
import { apiLimiter } from "@/middleware/rateLimiter";
import { authLimiter } from "@/middleware/rateLimiter";
import cors from "cors";
import { requestId } from "@/middleware/requestId";
import { loggingMiddleware } from "@/middleware/loggingMiddleware";
import { compressionMiddleware } from "@/middleware/performanceMiddleware";
import { metricsMiddleware } from "@/middleware/monitoringMiddleware";
import monitoringRoutes from "@/routes/monitoring.routes";
import { ErrorMonitoringService } from "@/services/errorMonitoring.service";
import { ErrorRequestHandler } from "express";
import { notFoundHandler } from "./middleware/notFound";
import { openAPIRouter } from "./docs/openAPIRouter";

const app = express();

// Initialize error monitoring
ErrorMonitoringService.getInstance();

// Group middleware by function
const setupMiddleware = (app: express.Application) => {
  // Security
  app.use(requestId);
  setupSecurityHeaders(app as express.Express);
  app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));

  // Performance
  app.use(compressionMiddleware);
  app.use(express.json({ limit: "10kb" }));

  // Monitoring
  app.use(loggingMiddleware);
  app.use(metricsMiddleware);

  // Rate Limiting
  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);
};

setupMiddleware(app);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "🚀 Hello from express-boilerplate Backend!" });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Monitoring routes
app.use("/api/monitoring", monitoringRoutes);

// Swagger documentation
app.use(openAPIRouter);

// Not found handler (must be before error handler)
app.use(notFoundHandler);

// Error Handler should be last
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  return errorHandler(err, req, res, next);
};

app.use(errorMiddleware);

export default app;
