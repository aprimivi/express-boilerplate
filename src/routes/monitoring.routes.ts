import { Router } from "express";
import { MonitoringController } from "@/controllers/monitoring.controller";
import { MetricsService } from "@/services/metrics.service";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerRoute } from "@/docs/openAPIHelpers";

// ─── OpenAPI Registry ────────────────────────────────────────────────
export const monitoringRegistry = new OpenAPIRegistry();

registerRoute(monitoringRegistry, {
  method: "get",
  path: "/monitoring/metrics",
  tags: ["Monitoring"],
  summary: "Get system metrics",
  security: true,
  responseDescription: "Prometheus metrics in text format",
});

registerRoute(monitoringRegistry, {
  method: "get",
  path: "/monitoring/health",
  tags: ["Monitoring"],
  summary: "Check system health",
  responseSchema: z.object({
    status: z.string(),
    timestamp: z.string().datetime(),
    uptime: z.number(),
    memoryUsage: z.object({}).passthrough(),
  }),
});

registerRoute(monitoringRegistry, {
  method: "get",
  path: "/monitoring/readiness",
  tags: ["Monitoring"],
  summary: "Check if application is ready to handle traffic",
  responseSchema: z.object({ status: z.string() }),
});

registerRoute(monitoringRegistry, {
  method: "get",
  path: "/monitoring/liveness",
  tags: ["Monitoring"],
  summary: "Check if application is alive",
  responseSchema: z.object({ status: z.string() }),
});

registerRoute(monitoringRegistry, {
  method: "post",
  path: "/monitoring/alerts",
  tags: ["Monitoring"],
  summary: "Receive alerts from AlertManager",
  security: true,
  requestBody: z.object({
    alerts: z.array(z.object({}).passthrough()),
  }),
  responseDescription: "Alert received and processed",
});

registerRoute(monitoringRegistry, {
  method: "get",
  path: "/monitoring/simulate-error",
  tags: ["Monitoring"],
  summary: "Simulate random errors (for testing)",
  responseDescription: "Simulated error response",
});

// ─── Router ──────────────────────────────────────────────────────────
const router = Router();

const metricsService = new MetricsService();
const monitoringController = new MonitoringController(metricsService);

router.get("/metrics", monitoringController.getMetrics); // TODO: Add Authentication
router.get("/health", monitoringController.getHealth);
router.get("/readiness", monitoringController.getReadiness);
router.get("/liveness", monitoringController.getLiveness);
router.post("/alerts", monitoringController.handleAlert);
router.get("/simulate-error", monitoringController.simulateError);

router.get("/trigger-gc", async (req, res) => {
  if (global.gc) {
    global.gc();
    res.json({ message: "GC triggered" });
  } else {
    res.status(400).json({ message: "GC not exposed. Run Node with --expose-gc flag" });
  }
});

router.get("/simulate-memory-leak", (req, res) => {
  const arr: any[] = [];
  for (let i = 0; i < 1000000; i++) {
    arr.push(new Array(1000).fill("test"));
  }
  res.json({ message: "Memory leak simulated" });
});

export default router;
